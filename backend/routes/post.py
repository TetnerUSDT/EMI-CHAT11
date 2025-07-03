from fastapi import APIRouter, HTTPException, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
import logging
from bson import ObjectId
from datetime import datetime

from ..models.post import Post, PostCreate, PostResponse, ReactionCreate, MediaType, PostType
from ..models.user import User
from ..utils.auth import get_current_user

logger = logging.getLogger(__name__)

def create_post_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/posts", tags=["posts"])

    @router.post("/{channel_id}", response_model=PostResponse)
    async def create_post(
        channel_id: str,
        post_data: PostCreate,
        current_user: dict = Depends(get_current_user)
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
            user_id = current_user["sub"]
            is_owner = channel.get("owner_id") == user_id
            is_admin = user_id in channel.get("admins", [])
            
            if not (is_owner or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only channel administrators can create posts"
                )
            
            # Determine post type
            post_type = PostType.MEDIA if post_data.media_url else PostType.TEXT
            
            # Get the next sequence number for this channel
            last_post = await db.posts.find_one(
                {"channel_id": channel_id},
                sort=[("sequence_number", -1)]
            )
            next_sequence = (last_post.get("sequence_number", 0) + 1) if last_post else 1
            
            # Create new post
            new_post = Post(
                channel_id=channel_id,
                author_id=user_id,
                sequence_number=next_sequence,
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
                sequence_number=new_post.sequence_number,
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
        limit: int = 10,
        before_sequence: Optional[int] = None,  # Get posts before this sequence number
        current_user: dict = Depends(get_current_user)
    ):
        """Get posts from a channel with cursor-based pagination"""
        try:
            # Check if channel exists and user has access
            channel = await db.chats.find_one({"_id": ObjectId(channel_id)})
            if not channel:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Channel not found"
                )
            
            # Check if user is subscribed to the channel
            user_id = current_user["sub"]
            if user_id not in channel.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be subscribed to view channel posts"
                )
            
            # Build query for cursor-based pagination
            query = {"channel_id": channel_id}
            if before_sequence:
                query["sequence_number"] = {"$lt": before_sequence}
            
            # Get posts from database - sorted by sequence number descending
            posts_cursor = db.posts.find(query).sort("sequence_number", -1).limit(limit)
            
            posts = await posts_cursor.to_list(length=limit)
            
            # For frontend display, reverse the order so oldest posts appear first
            # This maintains chat-like chronological order (oldest to newest)
            posts.reverse()
            
            # Convert to PostResponse objects
            result = []
            for post_doc in posts:
                # Get author info
                author = await db.users.find_one({"_id": ObjectId(post_doc["author_id"])})
                
                result.append(PostResponse(
                    id=str(post_doc["_id"]),
                    channel_id=post_doc["channel_id"],
                    author_id=post_doc["author_id"],
                    sequence_number=post_doc.get("sequence_number", 0),
                    author_name=author.get("name") if author else "Unknown",
                    author_avatar=author.get("avatar") if author else None,
                    channel_name=channel.get("name"),
                    text=post_doc.get("text"),
                    media_url=post_doc.get("media_url"),
                    media_type=post_doc.get("media_type"),
                    post_type=post_doc.get("post_type", "text"),
                    reactions=post_doc.get("reactions", {}),
                    views=post_doc.get("views", 0),
                    comments_count=post_doc.get("comments_count", 0),
                    created_at=post_doc["created_at"]
                ))
            
            return result
            
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
        current_user: dict = Depends(get_current_user)
    ):
        """Add or remove reaction to a post (max 3 reactions per user)"""
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
            
            user_id = current_user["sub"]
            if user_id not in channel.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You must be subscribed to react to posts"
                )
            
            # Get current reactions
            reactions = post.get("reactions", {})
            reaction_type = reaction_data.reaction_type
            
            # Count user's current reactions
            user_reaction_count = 0
            user_reactions = []
            for r_type, users in reactions.items():
                if user_id in users:
                    user_reaction_count += 1
                    user_reactions.append(r_type)
            
            # Check if user already reacted with this type
            if reaction_type in reactions and user_id in reactions[reaction_type]:
                # Remove the reaction (toggle off)
                reactions[reaction_type].remove(user_id)
                if not reactions[reaction_type]:  # Remove empty lists
                    del reactions[reaction_type]
            else:
                # Check if user can add more reactions (max 3)
                if user_reaction_count >= 3:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Maximum 3 reactions per user allowed"
                    )
                
                # Check if we can add a new reaction type (max 6 total types)
                if reaction_type not in reactions and len(reactions) >= 6:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Maximum 6 different reaction types allowed per post"
                    )
                
                # Add the reaction
                if reaction_type not in reactions:
                    reactions[reaction_type] = []
                reactions[reaction_type].append(user_id)
            
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
        current_user: dict = Depends(get_current_user)
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
            
            user_id = current_user["sub"]
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