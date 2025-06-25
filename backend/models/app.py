from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class AppScreenshot(BaseModel):
    url: str
    caption: Optional[str] = None

class AppReview(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    username: str
    rating: int = Field(ge=1, le=5)  # 1-5 stars
    comment: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    helpful_count: int = Field(default=0)

class App(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    developer: str
    icon_url: str
    description: str
    short_description: Optional[str] = None
    category: str
    subcategory: Optional[str] = None
    version: str
    size_mb: float
    age_rating: str = "3+"  # 3+, 12+, 16+, 18+
    
    # App Store metrics
    rating: float = Field(default=0.0, ge=0, le=5)
    rating_count: int = Field(default=0)
    download_count: int = Field(default=0)
    
    # Media
    screenshots: List[AppScreenshot] = Field(default_factory=list)
    video_url: Optional[str] = None
    
    # Store info
    price: float = Field(default=0.0)  # 0 for free apps
    in_app_purchases: bool = Field(default=False)
    contains_ads: bool = Field(default=False)
    
    # Dates
    release_date: datetime
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # User interactions
    is_pinned: bool = Field(default=False)
    is_installed: bool = Field(default=False)
    is_wishlisted: bool = Field(default=False)
    
    # Similar apps
    similar_app_ids: List[str] = Field(default_factory=list)

class AppResponse(BaseModel):
    app: App
    reviews: List[AppReview] = Field(default_factory=list)
    similar_apps: List[App] = Field(default_factory=list)

class AppListResponse(BaseModel):
    apps: List[App]
    total: int
    page: int
    per_page: int