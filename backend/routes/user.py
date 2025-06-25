from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
import logging

from ..models.user import User, UserResponse
from ..utils.auth import get_current_user

logger = logging.getLogger(__name__)

def create_user_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/users", tags=["users"])
    
    @router.get("/search", response_model=List[UserResponse])
    async def search_users(
        query: str = Query(..., min_length=1),
        limit: int = Query(10, ge=1, le=50),
        current_user: dict = Depends(get_current_user)
    ):
        """Search users by username or wallet address"""
        try:
            current_user_id = current_user["sub"]
            
            # Create search filter
            search_filter = {
                "_id": {"$ne": ObjectId(current_user_id)},  # Exclude current user
                "$or": [
                    {"username": {"$regex": query, "$options": "i"}},
                    {"wallet_address": {"$regex": query, "$options": "i"}}
                ]
            }
            
            # Find users
            users_cursor = db.users.find(search_filter).limit(limit)
            users = await users_cursor.to_list(length=None)
            
            user_responses = []
            for user_doc in users:
                user = User(**user_doc)
                user_responses.append(UserResponse(
                    id=str(user_doc["_id"]),
                    wallet_address=user.wallet_address,
                    network=user.network,
                    username=user.username,
                    avatar=user.avatar,
                    trust_score=user.trust_score,
                    is_online=user.is_online,
                    last_seen=user.last_seen,
                    created_at=user.created_at
                ))
            
            return user_responses
            
        except Exception as e:
            logger.error(f"Error searching users: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to search users"
            )
    
    @router.get("/{user_id}", response_model=UserResponse)
    async def get_user_profile(
        user_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get user profile by ID"""
        try:
            # Validate ObjectId format
            if not ObjectId.is_valid(user_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format"
                )
            
            user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
            
            if not user_doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            user = User(**user_doc)
            return UserResponse(
                id=str(user_doc["_id"]),
                wallet_address=user.wallet_address,
                network=user.network,
                username=user.username,
                avatar=user.avatar,
                trust_score=user.trust_score,
                is_online=user.is_online,
                last_seen=user.last_seen,
                created_at=user.created_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get user profile"
            )
    
    @router.put("/profile", response_model=UserResponse)
    async def update_profile(
        profile_data: dict,
        current_user: dict = Depends(get_current_user)
    ):
        """Update current user's profile"""
        try:
            user_id = current_user["sub"]
            
            # Validate ObjectId format
            if not ObjectId.is_valid(user_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format"
                )
            
            # Define allowed fields for update
            allowed_fields = {"username", "avatar"}
            update_data = {
                key: value for key, value in profile_data.items() 
                if key in allowed_fields and value is not None
            }
            
            if not update_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No valid fields to update"
                )
            
            # Add updated timestamp
            update_data["updated_at"] = datetime.utcnow()
            
            # Update user
            result = await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Get updated user
            updated_user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
            user = User(**updated_user_doc)
            
            return UserResponse(
                id=str(updated_user_doc["_id"]),
                wallet_address=user.wallet_address,
                network=user.network,
                username=user.username,
                avatar=user.avatar,
                trust_score=user.trust_score,
                is_online=user.is_online,
                last_seen=user.last_seen,
                created_at=user.created_at
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating profile: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
    
    @router.get("/", response_model=List[UserResponse])
    async def get_users(
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=100),
        current_user: dict = Depends(get_current_user)
    ):
        """Get users list (for admin or development purposes)"""
        try:
            skip = (page - 1) * limit
            
            users_cursor = db.users.find().skip(skip).limit(limit).sort("created_at", -1)
            users = await users_cursor.to_list(length=None)
            
            user_responses = []
            for user_doc in users:
                user = User(**user_doc)
                user_responses.append(UserResponse(
                    id=str(user_doc["_id"]),
                    wallet_address=user.wallet_address,
                    network=user.network,
                    username=user.username,
                    avatar=user.avatar,
                    trust_score=user.trust_score,
                    is_online=user.is_online,
                    last_seen=user.last_seen,
                    created_at=user.created_at
                ))
            
            return user_responses
            
        except Exception as e:
            logger.error(f"Error getting users: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get users"
            )
    
    return router