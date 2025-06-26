from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
from typing import List, Optional
import logging

from ..models.chat import (
    Chat, ChatCreate, ChatResponse, 
    Message, MessageCreate, MessageResponse,
    ChatType, MessageType
)
from ..models.user import User, UserResponse
from ..utils.auth import get_current_user

logger = logging.getLogger(__name__)

def create_chat_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/chats", tags=["chats"])
    
    @router.get("/", response_model=List[ChatResponse])
    async def get_user_chats(
        chat_type: Optional[str] = Query(None),
        current_user: dict = Depends(get_current_user)
    ):
        """Get all chats for current user, optionally filtered by type"""
        try:
            user_id = current_user["sub"]
            
            # Build filter
            filter_query = {"participants": user_id}
            if chat_type:
                filter_query["chat_type"] = chat_type
            
            # Find all chats where user is participant
            chats_cursor = db.chats.find(filter_query).sort("updated_at", -1)
            
            chats = await chats_cursor.to_list(length=None)
            
            chat_responses = []
            for chat_doc in chats:
                chat_responses.append(ChatResponse(
                    id=str(chat_doc["_id"]),
                    name=chat_doc.get("name"),
                    chat_type=chat_doc.get("chat_type"),
                    participants=chat_doc.get("participants", []),
                    admins=chat_doc.get("admins", []),
                    avatar=chat_doc.get("avatar"),
                    description=chat_doc.get("description"),
                    is_secret=chat_doc.get("is_secret", False),
                    secret_timer=chat_doc.get("secret_timer"),
                    is_public=chat_doc.get("is_public", False),
                    channel_username=chat_doc.get("channel_username"),
                    subscriber_count=chat_doc.get("subscriber_count", 0),
                    last_message_id=chat_doc.get("last_message_id"),
                    last_message_time=chat_doc.get("last_message_time"),
                    created_by=chat_doc.get("created_by"),
                    owner_id=chat_doc.get("owner_id"),
                    allow_all_messages=chat_doc.get("allow_all_messages", False),
                    created_at=chat_doc.get("created_at")
                ))
            
            return chat_responses
            
        except Exception as e:
            logger.error(f"Error getting user chats: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get chats"
            )
    
    @router.post("/", response_model=ChatResponse)
    async def create_chat(chat_data: ChatCreate, current_user: dict = Depends(get_current_user)):
        """Create new chat"""
        try:
            user_id = current_user["sub"]
            
            # Handle different chat types
            if chat_data.chat_type == ChatType.PERSONAL:
                if not chat_data.participant_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Participant ID required for personal chat"
                    )
                
                # Check if personal chat already exists
                existing_chat = await db.chats.find_one({
                    "chat_type": "personal",
                    "participants": {"$all": [user_id, chat_data.participant_id]}
                })
                
                if existing_chat:
                    chat = Chat(**existing_chat)
                    chat.id = str(existing_chat["_id"])  # Set proper ID from MongoDB
                    return ChatResponse(
                        id=chat.id,
                        name=chat.name,
                        chat_type=chat.chat_type,
                        participants=chat.participants,
                        admins=chat.admins,
                        avatar=chat.avatar,
                        description=chat.description,
                        is_secret=chat.is_secret,
                        secret_timer=chat.secret_timer,
                        is_public=chat.is_public,
                        channel_username=chat.channel_username,
                        subscriber_count=chat.subscriber_count,
                        last_message_id=chat.last_message_id,
                        last_message_time=chat.last_message_time,
                        created_by=chat.created_by,
                        created_at=chat.created_at
                    )
                
                participants = [user_id, chat_data.participant_id]
                admins = []
            elif chat_data.chat_type == ChatType.CHANNEL:
                # Channels: only admins are participants initially
                participants = [user_id]
                admins = [user_id]
                
                # Check username uniqueness for public channels
                if chat_data.is_public and chat_data.channel_username:
                    existing_channel = await db.chats.find_one({
                        "chat_type": "channel",
                        "channel_username": chat_data.channel_username
                    })
                    if existing_channel:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Channel username already taken"
                        )
            else:
                # Group or secret chat
                participants = list(set([user_id] + chat_data.participants))
                admins = [user_id]
            
            # Create new chat
            new_chat = Chat(
                name=chat_data.name,
                chat_type=chat_data.chat_type,
                participants=participants,
                admins=admins,
                description=chat_data.description,
                is_secret=chat_data.is_secret,
                secret_timer=chat_data.secret_timer,
                is_public=chat_data.is_public,
                channel_username=chat_data.channel_username,
                subscriber_count=0 if chat_data.chat_type == ChatType.CHANNEL else len(participants),
                owner_id=user_id if chat_data.chat_type == ChatType.CHANNEL else None,
                allow_all_messages=False,  # Default to admin-only for channels
                created_by=user_id
            )
            
            # Create new chat dict without the 'id' field for MongoDB insertion
            chat_dict = new_chat.dict()
            chat_dict.pop('id', None)  # Remove the UUID id field before inserting
            
            result = await db.chats.insert_one(chat_dict)
            new_chat.id = str(result.inserted_id)
            
            return ChatResponse(
                id=new_chat.id,
                name=new_chat.name,
                chat_type=new_chat.chat_type,
                participants=new_chat.participants,
                admins=new_chat.admins,
                avatar=new_chat.avatar,
                description=new_chat.description,
                is_secret=new_chat.is_secret,
                secret_timer=new_chat.secret_timer,
                is_public=new_chat.is_public,
                channel_username=new_chat.channel_username,
                subscriber_count=new_chat.subscriber_count,
                last_message_id=new_chat.last_message_id,
                last_message_time=new_chat.last_message_time,
                created_by=new_chat.created_by,
                owner_id=new_chat.owner_id,
                allow_all_messages=new_chat.allow_all_messages,
                created_at=new_chat.created_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating chat: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat"
            )
    
    @router.get("/{chat_id}/messages", response_model=List[MessageResponse])
    async def get_chat_messages(
        chat_id: str,
        page: int = Query(1, ge=1),
        limit: int = Query(50, ge=1, le=100),
        current_user: dict = Depends(get_current_user)
    ):
        """Get messages for a chat"""
        try:
            from bson import ObjectId
            
            user_id = current_user["sub"]
            
            # Check if user is participant in chat
            chat_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            chat = await db.chats.find_one(chat_filter)
            if not chat or user_id not in chat.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this chat"
                )
            
            # Calculate skip value for pagination
            skip = (page - 1) * limit
            
            # Get messages
            messages_cursor = db.messages.find({
                "chat_id": chat_id
            }).sort("timestamp", -1).skip(skip).limit(limit)
            
            messages = await messages_cursor.to_list(length=None)
            
            message_responses = []
            for msg_doc in messages:
                message = Message(**msg_doc)
                message.id = str(msg_doc["_id"])  # Set proper ID from MongoDB
                message_responses.append(MessageResponse(
                    id=message.id,
                    chat_id=message.chat_id,
                    sender_id=message.sender_id,
                    content=message.content,
                    message_type=message.message_type,
                    sticker_url=message.sticker_url,
                    file_url=message.file_url,
                    file_name=message.file_name,
                    file_size=message.file_size,
                    is_encrypted=message.is_encrypted,
                    expires_at=message.expires_at,
                    timestamp=message.timestamp
                ))
            
            # Reverse to get chronological order
            return list(reversed(message_responses))
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting chat messages: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get messages"
            )
    
    @router.post("/{chat_id}/messages", response_model=MessageResponse)
    async def send_message(
        chat_id: str,
        message_data: MessageCreate,
        current_user: dict = Depends(get_current_user)
    ):
        """Send message to chat"""
        try:
            from bson import ObjectId
            
            user_id = current_user["sub"]
            
            # Check if user is participant in chat
            chat_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            chat = await db.chats.find_one(chat_filter)
            if not chat or user_id not in chat.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this chat"
                )
            
            # Calculate expiry time for secret messages
            expires_at = None
            if chat.get("is_secret") and message_data.expires_in:
                expires_at = datetime.utcnow() + timedelta(seconds=message_data.expires_in)
            elif chat.get("is_secret") and chat.get("secret_timer"):
                expires_at = datetime.utcnow() + timedelta(seconds=chat["secret_timer"])
            
            # Create new message
            new_message = Message(
                chat_id=chat_id,
                sender_id=user_id,
                content=message_data.content,
                message_type=message_data.message_type,
                sticker_url=message_data.sticker_url,
                is_encrypted=chat.get("is_secret", False),
                expires_at=expires_at
            )
            
            # Create new message dict without the 'id' field for MongoDB insertion
            message_dict = new_message.dict()
            message_dict.pop('id', None)  # Remove the UUID id field before inserting
            
            result = await db.messages.insert_one(message_dict)
            new_message.id = str(result.inserted_id)
            
            # Update chat's last message
            from bson import ObjectId
            chat_update_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            await db.chats.update_one(
                chat_update_filter,
                {
                    "$set": {
                        "last_message_id": new_message.id,
                        "last_message_time": new_message.timestamp,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return MessageResponse(
                id=new_message.id,
                chat_id=new_message.chat_id,
                sender_id=new_message.sender_id,
                content=new_message.content,
                message_type=new_message.message_type,
                sticker_url=new_message.sticker_url,
                file_url=new_message.file_url,
                file_name=new_message.file_name,
                file_size=new_message.file_size,
                is_encrypted=new_message.is_encrypted,
                expires_at=new_message.expires_at,
                timestamp=new_message.timestamp
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error sending message: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send message"
            )
    
    @router.get("/search")
    async def search_chats(
        query: str = Query(..., min_length=1),
        chat_type: Optional[str] = Query(None),
        current_user: dict = Depends(get_current_user)
    ):
        """Search chats by name or search public channels"""
        try:
            user_id = current_user["sub"]
            
            if chat_type == "channel":
                # Search public channels
                search_filter = {
                    "chat_type": "channel",
                    "is_public": True,
                    "$or": [
                        {"name": {"$regex": query, "$options": "i"}},
                        {"channel_username": {"$regex": query, "$options": "i"}},
                        {"description": {"$regex": query, "$options": "i"}}
                    ]
                }
            else:
                # Search in user's chats
                search_filter = {
                    "participants": user_id,
                    "name": {"$regex": query, "$options": "i"}
                }
                if chat_type:
                    search_filter["chat_type"] = chat_type
            
            chats_cursor = db.chats.find(search_filter).sort("updated_at", -1)
            chats = await chats_cursor.to_list(length=20)
            
            chat_responses = []
            for chat_doc in chats:
                chat_responses.append(ChatResponse(
                    id=str(chat_doc["_id"]),
                    name=chat_doc.get("name"),
                    chat_type=chat_doc.get("chat_type"),
                    participants=chat_doc.get("participants", []),
                    admins=chat_doc.get("admins", []),
                    avatar=chat_doc.get("avatar"),
                    description=chat_doc.get("description"),
                    is_secret=chat_doc.get("is_secret", False),
                    secret_timer=chat_doc.get("secret_timer"),
                    is_public=chat_doc.get("is_public", False),
                    channel_username=chat_doc.get("channel_username"),
                    subscriber_count=chat_doc.get("subscriber_count", 0),
                    last_message_id=chat_doc.get("last_message_id"),
                    last_message_time=chat_doc.get("last_message_time"),
                    created_by=chat_doc.get("created_by"),
                    owner_id=chat_doc.get("owner_id"),
                    allow_all_messages=chat_doc.get("allow_all_messages", False),
                    created_at=chat_doc.get("created_at")
                ))
            
            return chat_responses
            
        except Exception as e:
            logger.error(f"Error searching chats: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to search chats"
            )
    
    @router.post("/{chat_id}/subscribe")
    async def subscribe_to_channel(
        chat_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Subscribe to a channel"""
        try:
            user_id = current_user["sub"]
            
            # Check if chat exists and is a channel
            from bson import ObjectId
            chat_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            chat = await db.chats.find_one(chat_filter)
            if not chat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Channel not found"
                )
            
            if chat.get("chat_type") != "channel":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Not a channel"
                )
            
            # Check if already subscribed
            if user_id in chat.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already subscribed"
                )
            
            # Add user to participants and increment subscriber count
            await db.chats.update_one(
                chat_filter,
                {
                    "$addToSet": {"participants": user_id},
                    "$inc": {"subscriber_count": 1},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return {"message": "Successfully subscribed to channel"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error subscribing to channel: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to subscribe to channel"
            )
    
    @router.patch("/{chat_id}/pin")
    async def toggle_chat_pin(
        chat_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Toggle pin status of a chat"""
        try:
            user_id = current_user["sub"]
            
            # Check if chat exists and user has access
            from bson import ObjectId
            chat_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            chat = await db.chats.find_one(chat_filter)
            if not chat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat not found"
                )
            
            if user_id not in chat.get("participants", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this chat"
                )
            
            # Toggle pin status
            current_pin_status = chat.get("is_pinned", False)
            new_pin_status = not current_pin_status
            
            await db.chats.update_one(
                chat_filter,
                {
                    "$set": {
                        "is_pinned": new_pin_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {
                "message": f"Chat {'pinned' if new_pin_status else 'unpinned'} successfully",
                "is_pinned": new_pin_status
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error toggling chat pin: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to toggle chat pin"
            )
    
    @router.put("/{chat_id}", response_model=ChatResponse)
    async def update_chat(
        chat_id: str,
        chat_update: dict,
        current_user: dict = Depends(get_current_user)
    ):
        """Update chat information (name, description, avatar, etc.)"""
        try:
            user_id = current_user["sub"]
            
            # Check if chat exists and user has access
            from bson import ObjectId
            chat_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            chat = await db.chats.find_one(chat_filter)
            if not chat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat not found"
                )
            
            # Check if user is owner or admin
            is_owner = chat.get("owner_id") == user_id
            is_admin = user_id in chat.get("admins", [])
            
            if not (is_owner or is_admin):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only channel owners and administrators can update channel settings"
                )
            
            # Validate required fields
            if "name" in chat_update and not chat_update["name"].strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Channel name cannot be empty"
                )
            
            # Prepare update data
            update_data = {"updated_at": datetime.utcnow()}
            
            # Only allow updating certain fields
            allowed_fields = ["name", "description", "avatar", "allow_all_messages", "background_style"]
            for field in allowed_fields:
                if field in chat_update:
                    update_data[field] = chat_update[field]
            
            # Update the chat
            await db.chats.update_one(
                chat_filter,
                {"$set": update_data}
            )
            
            # Return updated chat
            updated_chat = await db.chats.find_one(chat_filter)
            
            return ChatResponse(
                id=str(updated_chat["_id"]),
                name=updated_chat.get("name"),
                chat_type=updated_chat.get("chat_type"),
                participants=updated_chat.get("participants", []),
                admins=updated_chat.get("admins", []),
                avatar=updated_chat.get("avatar"),
                description=updated_chat.get("description"),
                is_secret=updated_chat.get("is_secret", False),
                secret_timer=updated_chat.get("secret_timer"),
                is_public=updated_chat.get("is_public", False),
                channel_username=updated_chat.get("channel_username"),
                subscriber_count=updated_chat.get("subscriber_count", 0),
                last_message_id=updated_chat.get("last_message_id"),
                last_message_time=updated_chat.get("last_message_time"),
                created_by=updated_chat.get("created_by"),
                owner_id=updated_chat.get("owner_id"),
                allow_all_messages=updated_chat.get("allow_all_messages", False),
                created_at=updated_chat.get("created_at")
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating chat: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update chat"
            )
    
    @router.patch("/{chat_id}/background")
    async def update_channel_background(
        chat_id: str,
        background_style: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Update channel background style"""
        try:
            user_id = current_user["sub"]
            
            # Check if chat exists and is a channel
            from bson import ObjectId
            chat_filter = {"_id": ObjectId(chat_id)} if ObjectId.is_valid(chat_id) else {"_id": chat_id}
            chat = await db.chats.find_one(chat_filter)
            if not chat:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat not found"
                )
            
            # Check if it's a channel
            if chat.get("chat_type") != "channel":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Background can only be set for channels"
                )
            
            # Check if user is admin/owner
            if user_id not in chat.get("admins", []) and user_id != chat.get("owner_id"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only administrators can change channel background"
                )
            
            # Validate background style
            valid_styles = ["default", "dark-structure"]
            if background_style not in valid_styles:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid background style. Must be one of: {valid_styles}"
                )
            
            # Update background style
            await db.chats.update_one(
                chat_filter,
                {
                    "$set": {
                        "background_style": background_style,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {
                "message": "Channel background updated successfully",
                "background_style": background_style
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating channel background: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update channel background"
            )
    
    return router