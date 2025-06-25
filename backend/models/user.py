from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

class NetworkType(str, Enum):
    BSC = "BSC"
    TRON = "TRON"
    TON = "TON"
    ETHEREUM = "ETHEREUM"

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    wallet_address: str
    network: NetworkType
    username: Optional[str] = None
    avatar: Optional[str] = None
    trust_score: int = Field(default=0)
    is_online: bool = Field(default=True)
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True

class UserCreate(BaseModel):
    wallet_address: str
    network: NetworkType
    signature: str
    message: str
    username: Optional[str] = None

class UserLogin(BaseModel):
    wallet_address: str
    network: NetworkType
    signature: str
    message: str

class UserResponse(BaseModel):
    id: str
    wallet_address: str
    network: str
    username: Optional[str]
    avatar: Optional[str]
    trust_score: int
    is_online: bool
    last_seen: datetime
    created_at: datetime

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    token_type: str = "bearer"