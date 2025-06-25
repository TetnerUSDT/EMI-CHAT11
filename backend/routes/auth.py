from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
import os
import logging

from ..models.user import User, UserCreate, UserLogin, UserResponse, AuthResponse, NetworkType
from ..utils.web3_auth import Web3Auth
from ..utils.auth import create_access_token, get_current_user

logger = logging.getLogger(__name__)

def create_auth_router(db: AsyncIOMotorDatabase) -> APIRouter:
    router = APIRouter(prefix="/auth", tags=["authentication"])
    
    @router.post("/generate-message")
    async def generate_auth_message(wallet_address: str, network: NetworkType):
        """Generate message for wallet signature"""
        try:
            message, timestamp = Web3Auth.generate_auth_message(wallet_address)
            
            return {
                "message": message,
                "timestamp": timestamp,
                "wallet_address": wallet_address,
                "network": network
            }
        except Exception as e:
            logger.error(f"Error generating auth message: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate authentication message"
            )
    
    @router.post("/login", response_model=AuthResponse)
    async def login_with_wallet(user_data: UserLogin):
        """Login or register user with wallet signature"""
        try:
            # Verify message timestamp
            if not Web3Auth.is_message_valid(user_data.message):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Message expired or invalid"
                )
            
            # Verify signature
            if not Web3Auth.verify_signature(
                user_data.message, 
                user_data.signature, 
                user_data.wallet_address, 
                user_data.network
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid signature"
                )
            
            # Check if user exists
            existing_user = await db.users.find_one({
                "wallet_address": user_data.wallet_address.lower(),
                "network": user_data.network
            })
            
            if existing_user:
                # Update last seen
                await db.users.update_one(
                    {"_id": existing_user["_id"]},
                    {
                        "$set": {
                            "last_seen": datetime.utcnow(),
                            "is_online": True,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                user = User(**existing_user)
                user.id = str(existing_user["_id"])
            else:
                # Create new user
                new_user = User(
                    wallet_address=user_data.wallet_address.lower(),
                    network=user_data.network,
                    username=f"user_{user_data.wallet_address[-6:]}",
                    avatar=f"https://api.dicebear.com/7.x/identicon/svg?seed={user_data.wallet_address}"
                )
                
                result = await db.users.insert_one(new_user.dict())
                new_user.id = str(result.inserted_id)
                user = new_user
            
            # Create access token
            access_token = create_access_token(
                data={"sub": str(user.id), "wallet_address": user.wallet_address, "network": user.network}
            )
            
            user_response = UserResponse(
                id=str(user.id),
                wallet_address=user.wallet_address,
                network=user.network,
                username=user.username,
                avatar=user.avatar,
                trust_score=user.trust_score,
                is_online=user.is_online,
                last_seen=user.last_seen,
                created_at=user.created_at
            )
            
            return AuthResponse(
                user=user_response,
                access_token=access_token
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error during login: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Login failed"
            )
    
    @router.post("/logout")
    async def logout(current_user: dict = Depends(get_current_user)):
        """Logout user"""
        try:
            from bson import ObjectId
            
            user_id = current_user["sub"]
            if not ObjectId.is_valid(user_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid user ID format"
                )
            
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {
                    "$set": {
                        "is_online": False,
                        "last_seen": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {"message": "Logged out successfully"}
            
        except Exception as e:
            logger.error(f"Error during logout: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Logout failed"
            )
    
    @router.get("/me", response_model=UserResponse)
    async def get_current_user_info(current_user: dict = Depends(get_current_user)):
        """Get current user information"""
        try:
            from bson import ObjectId
            
            # Validate ObjectId format
            user_id = current_user["sub"]
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
            logger.error(f"Error getting user info: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get user information"
            )
    
    return router