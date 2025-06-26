from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from enum import Enum

class ChatType(str, Enum):
    PERSONAL = "personal"
    GROUP = "group"
    SECRET = "secret"
    CHANNEL = "channel"

class MessageType(str, Enum):
    TEXT = "text"
    STICKER = "sticker"
    VOICE = "voice"
    IMAGE = "image"
    VIDEO = "video"
    FILE = "file"

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chat_id: str
    sender_id: str
    content: str
    message_type: MessageType = MessageType.TEXT
    sticker_url: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    is_encrypted: bool = Field(default=False)
    expires_at: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True

class Chat(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = None
    chat_type: ChatType
    participants: List[str] = Field(default_factory=list)
    admins: List[str] = Field(default_factory=list)
    avatar: Optional[str] = None
    description: Optional[str] = None
    is_secret: bool = Field(default=False)
    secret_timer: Optional[int] = None  # seconds
    is_pinned: bool = Field(default=False)  # for pinning chats
    is_public: bool = Field(default=False)  # for channels
    channel_username: Optional[str] = None  # for public channels
    subscriber_count: int = Field(default=0)  # for channels
    last_message_id: Optional[str] = None
    last_message_time: Optional[datetime] = None
    created_by: str
    owner_id: Optional[str] = None  # for channels - who owns the channel
    allow_all_messages: bool = Field(default=False)  # for channels - if all subscribers can send messages
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True

class ChatCreate(BaseModel):
    name: Optional[str] = None
    chat_type: ChatType
    participant_id: Optional[str] = None  # For personal chats
    participants: List[str] = Field(default_factory=list)  # For group chats
    is_secret: bool = Field(default=False)
    secret_timer: Optional[int] = None
    description: Optional[str] = None  # For channels and groups
    is_public: bool = Field(default=False)  # For channels
    channel_username: Optional[str] = None  # For public channels

class MessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    sticker_url: Optional[str] = None
    expires_in: Optional[int] = None  # seconds for secret messages

class ChatResponse(BaseModel):
    id: str
    name: Optional[str]
    chat_type: str
    participants: List[str]
    admins: List[str]
    avatar: Optional[str]
    description: Optional[str]
    is_secret: bool
    secret_timer: Optional[int]
    is_public: bool
    channel_username: Optional[str]
    subscriber_count: int
    last_message_id: Optional[str]
    last_message_time: Optional[datetime]
    created_by: str
    owner_id: Optional[str]
    allow_all_messages: bool
    created_at: datetime

class MessageResponse(BaseModel):
    id: str
    chat_id: str
    sender_id: str
    content: str
    message_type: str
    sticker_url: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    is_encrypted: bool
    expires_at: Optional[datetime]
    timestamp: datetime