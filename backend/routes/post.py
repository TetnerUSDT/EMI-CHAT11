from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
import logging
from bson import ObjectId
from datetime import datetime

from ..models.post import Post, PostCreate, PostResponse, ReactionCreate, MediaType, PostType
from ..models.user import UserInDB
from ..auth import get_current_user

logger = logging.getLogger(__name__)

def create_post_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/posts", tags=["posts"])

    @router.post("/{channel_id}", response_model=PostResponse)
    async def create_post(
        channel_id: str,
        post_data: PostCreate,
        current_user: UserInDB = Depends(get_current_user)
    ):
        """Create a new post in a channel (admin only)"""
        try:
            # Check if channel exists
            channel = await db.chats.find_one({"_id": ObjectId(channel_id)})
            if not channel:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Channel not found"
                )
            
            # Check if it's actually a channel
            if channel.get("chat_type") != "channel":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not a channel"
                )
            
            # Check if user is admin or owner of the channel
            user_id = str(current_user.id)
            is_owner = channel.get("owner_id") == user_id
            is_admin = user_id in channel.get("admins", [])
            
            if not (is_owner or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only channel administrators can create posts"
                )
            
            # Determine post type
            post_type = PostType.MEDIA if post_data.media_url else PostType.TEXT
            
            # Create new post
            new_post = Post(
                channel_id=channel_id,
                author_id=user_id,
                text=post_data.text,
                media_url=post_data.media_url,
                media_type=post_data.media_type,
                post_type=post_type
            )
            
            # Insert into database
            post_dict = new_post.dict()
            post_dict.pop('id', None)  # Remove UUID id for MongoDB
            
            result = await db.posts.insert_one(post_dict)
            new_post.id = str(result.inserted_id)
            
            # Get author info for response
            author = await db.users.find_one({"_id": ObjectId(user_id)})
            
            return PostResponse(
                id=new_post.id,
                channel_id=new_post.channel_id,
                author_id=new_post.author_id,
                author_name=author.get("name") if author else "Unknown",
                author_avatar=author.get("avatar") if author else None,
                channel_name=channel.get("name"),
                text=new_post.text,
                media_url=new_post.media_url,
                media_type=new_post.media_type.value if new_post.media_type else None,
                post_type=new_post.post_type.value,
                reactions=new_post.reactions,
                views=new_post.views,
                comments_count=new_post.comments_count,
                created_at=new_post.created_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating post: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create post"
            )

    @router.get("/{channel_id}", response_model=List[PostResponse])
    async def get_channel_posts(
        channel_id: str,
        page: int = 1,
        limit: int = 20,
        current_user: UserInDB = Depends(get_current_user)
    ):
        """Get posts from a channel"""
        try:
            # Check if channel exists and user has access
            channel = await db.chats.find_one({"_id": ObjectId(channel_id)})
            if not channel:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Channel not found"
                )
            
            # Check if user is subscribed to the channel
            user_id = str(current_user.id)
            if user_id not in channel.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be subscribed to view channel posts"
                )
            
            # Calculate skip value for pagination
            skip = (page - 1) * limit
            
            # Get posts from database
            posts_cursor = db.posts.find(
                {"channel_id": channel_id}
            ).sort("created_at", -1).skip(skip).limit(limit)
            
            posts = await posts_cursor.to_list(length=limit)
            
            # Convert to PostResponse objects
            post_responses = []
            for post_doc in posts:
                # Get author info
                author = await db.users.find_one({"_id": ObjectId(post_doc["author_id"])})
                
                # Increment view count for this post
                await db.posts.update_one(
                    {"_id": post_doc["_id"]},
                    {"$inc": {"views": 1}}
                )
                
                post_responses.append(PostResponse(
                    id=str(post_doc["_id"]),
                    channel_id=post_doc["channel_id"],
                    author_id=post_doc["author_id"],
                    author_name=author.get("name") if author else "Unknown",
                    author_avatar=author.get("avatar") if author else None,
                    channel_name=channel.get("name"),
                    text=post_doc.get("text"),
                    media_url=post_doc.get("media_url"),
                    media_type=post_doc.get("media_type"),
                    post_type=post_doc.get("post_type", "text"),
                    reactions=post_doc.get("reactions", {}),
                    views=post_doc.get("views", 0) + 1,  # Include the incremented view
                    comments_count=post_doc.get("comments_count", 0),
                    created_at=post_doc.get("created_at")
                ))
            
            return post_responses
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting channel posts: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get posts"
            )

    @router.post("/{post_id}/reactions")
    async def add_reaction(
        post_id: str,
        reaction_data: ReactionCreate,
        current_user: UserInDB = Depends(get_current_user)
    ):
        """Add or remove reaction to a post"""
        try:
            # Check if post exists
            post = await db.posts.find_one({"_id": ObjectId(post_id)})
            if not post:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Post not found"
                )
            
            # Check if user has access to the channel
            channel = await db.chats.find_one({"_id": ObjectId(post["channel_id"])})
            if not channel:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Channel not found"
                )
            
            user_id = str(current_user.id)
            if user_id not in channel.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be subscribed to react to posts"
                )
            
            # Get current reactions
            reactions = post.get("reactions", {})
            reaction_type = reaction_data.reaction_type
            
            # Remove user from all reaction types first
            for r_type in reactions:
                if user_id in reactions[r_type]:
                    reactions[r_type].remove(user_id)
            
            # Add user to the new reaction type (if not removing)
            if reaction_type not in reactions:
                reactions[reaction_type] = []
            
            # Toggle reaction - if user already reacted with this type, remove it
            if user_id in reactions[reaction_type]:
                reactions[reaction_type].remove(user_id)
            else:
                reactions[reaction_type].append(user_id)
            
            # Clean up empty reaction lists
            reactions = {k: v for k, v in reactions.items() if v}
            
            # Update in database
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$set": {"reactions": reactions, "updated_at": datetime.utcnow()}}
            )
            
            return {"message": "Reaction updated successfully", "reactions": reactions}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error adding reaction: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add reaction"
            )

    @router.delete("/{post_id}")
    async def delete_post(
        post_id: str,
        current_user: UserInDB = Depends(get_current_user)
    ):
        """Delete a post (admin only)"""
        try:
            # Check if post exists
            post = await db.posts.find_one({"_id": ObjectId(post_id)})
            if not post:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Post not found"
                )
            
            # Check if user is admin or owner of the channel
            channel = await db.chats.find_one({"_id": ObjectId(post["channel_id"])})
            if not channel:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Channel not found"
                )
            
            user_id = str(current_user.id)
            is_owner = channel.get("owner_id") == user_id
            is_admin = user_id in channel.get("admins", [])
            is_author = post.get("author_id") == user_id
            
            if not (is_owner or is_admin or is_author):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only channel administrators or post author can delete posts"
                )
            
            # Delete the post
            result = await db.posts.delete_one({"_id": ObjectId(post_id)})
            
            if result.deleted_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Post not found"
                )
            
            return {"message": "Post deleted successfully"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting post: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete post"
            )

    return router