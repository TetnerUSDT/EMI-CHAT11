from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime
from enum import Enum
import uuid

class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"

class PostType(str, Enum):
    TEXT = "text"
    MEDIA = "media"

class Post(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    channel_id: str
    author_id: str
    sequence_number: int = Field(default=0)  # Sequential number for proper pagination
    text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[MediaType] = None
    post_type: PostType = PostType.TEXT
    reactions: Dict[str, List[str]] = Field(default_factory=dict)  # reaction_type -> [user_ids]
    views: int = Field(default=0)
    comments_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PostCreate(BaseModel):
    text: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[MediaType] = None

class PostResponse(BaseModel):
    id: str
    channel_id: str
    author_id: str
    sequence_number: int
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
    channel_name: Optional[str] = None
    text: Optional[str]
    media_url: Optional[str]
    media_type: Optional[str]
    post_type: str
    reactions: Dict[str, List[str]]
    views: int
    comments_count: int
    created_at: datetime

class ReactionCreate(BaseModel):
    reaction_type: str  # like, love, laugh, wow, sad, angry