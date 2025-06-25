from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional
import logging
from datetime import datetime
from bson import ObjectId

from models.app import App, AppResponse, AppListResponse, AppReview
from models.user import User
from auth.dependencies import get_current_user
from database import db

logger = logging.getLogger(__name__)

def create_app_router():
    router = APIRouter()

    @router.get("/apps", response_model=AppListResponse)
    async def get_apps(
        page: int = Query(1, ge=1),
        per_page: int = Query(20, ge=1, le=100),
        category: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        sort_by: str = Query("rating", regex="^(rating|downloads|name|updated)$"),
        current_user: dict = Depends(get_current_user)
    ):
        """Get list of apps with pagination and filtering"""
        try:
            # Build filter
            filter_dict = {}
            if category:
                filter_dict["category"] = category
            if search:
                filter_dict["$or"] = [
                    {"name": {"$regex": search, "$options": "i"}},
                    {"developer": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}}
                ]

            # Build sort
            sort_dict = {
                "rating": [("rating", -1), ("rating_count", -1)],
                "downloads": [("download_count", -1)],
                "name": [("name", 1)],
                "updated": [("last_updated", -1)]
            }

            skip = (page - 1) * per_page
            
            # Get total count
            total = await db.apps.count_documents(filter_dict)
            
            # Get apps
            cursor = db.apps.find(filter_dict).sort(sort_dict[sort_by]).skip(skip).limit(per_page)
            apps_data = await cursor.to_list(per_page)
            
            apps = [App(**app_data) for app_data in apps_data]
            
            return AppListResponse(
                apps=apps,
                total=total,
                page=page,
                per_page=per_page
            )

        except Exception as e:
            logger.error(f"Error getting apps: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get apps"
            )

    @router.get("/apps/{app_id}", response_model=AppResponse)
    async def get_app_details(
        app_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Get detailed app information including reviews and similar apps"""
        try:
            # Get app
            app_filter = {"_id": ObjectId(app_id)} if ObjectId.is_valid(app_id) else {"_id": app_id}
            app_data = await db.apps.find_one(app_filter)
            
            if not app_data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="App not found"
                )
            
            app = App(**app_data)
            
            # Get reviews (latest 10)
            reviews_cursor = db.app_reviews.find({"app_id": app_id}).sort("created_at", -1).limit(10)
            reviews_data = await reviews_cursor.to_list(10)
            reviews = [AppReview(**review_data) for review_data in reviews_data]
            
            # Get similar apps
            similar_apps = []
            if app.similar_app_ids:
                similar_filter = {"_id": {"$in": [ObjectId(sid) if ObjectId.is_valid(sid) else sid for sid in app.similar_app_ids]}}
                similar_cursor = db.apps.find(similar_filter).limit(5)
                similar_data = await similar_cursor.to_list(5)
                similar_apps = [App(**app_data) for app_data in similar_data]
            
            return AppResponse(
                app=app,
                reviews=reviews,
                similar_apps=similar_apps
            )

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting app details: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get app details"
            )

    @router.patch("/apps/{app_id}/pin")
    async def toggle_app_pin(
        app_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Toggle pin status of an app"""
        try:
            user_id = current_user["sub"]
            
            # Check if app exists
            app_filter = {"_id": ObjectId(app_id)} if ObjectId.is_valid(app_id) else {"_id": app_id}
            app = await db.apps.find_one(app_filter)
            if not app:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="App not found"
                )
            
            # Toggle pin status
            current_pin_status = app.get("is_pinned", False)
            new_pin_status = not current_pin_status
            
            await db.apps.update_one(
                app_filter,
                {
                    "$set": {
                        "is_pinned": new_pin_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {
                "message": f"App {'pinned' if new_pin_status else 'unpinned'} successfully",
                "is_pinned": new_pin_status
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error toggling app pin: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to toggle app pin"
            )

    @router.patch("/apps/{app_id}/wishlist")
    async def toggle_app_wishlist(
        app_id: str,
        current_user: dict = Depends(get_current_user)
    ):
        """Toggle wishlist status of an app"""
        try:
            user_id = current_user["sub"]
            
            # Check if app exists
            app_filter = {"_id": ObjectId(app_id)} if ObjectId.is_valid(app_id) else {"_id": app_id}
            app = await db.apps.find_one(app_filter)
            if not app:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="App not found"
                )
            
            # Toggle wishlist status
            current_wishlist_status = app.get("is_wishlisted", False)
            new_wishlist_status = not current_wishlist_status
            
            await db.apps.update_one(
                app_filter,
                {
                    "$set": {
                        "is_wishlisted": new_wishlist_status,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            return {
                "message": f"App {'added to' if new_wishlist_status else 'removed from'} wishlist successfully",
                "is_wishlisted": new_wishlist_status
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error toggling app wishlist: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to toggle app wishlist"
            )

    @router.post("/apps/{app_id}/reviews")
    async def create_app_review(
        app_id: str,
        rating: int = Query(..., ge=1, le=5),
        comment: str = Query(..., min_length=1, max_length=1000),
        current_user: dict = Depends(get_current_user)
    ):
        """Create a review for an app"""
        try:
            user_id = current_user["sub"]
            
            # Check if app exists
            app_filter = {"_id": ObjectId(app_id)} if ObjectId.is_valid(app_id) else {"_id": app_id}
            app = await db.apps.find_one(app_filter)
            if not app:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="App not found"
                )
            
            # Check if user already reviewed this app
            existing_review = await db.app_reviews.find_one({"app_id": app_id, "user_id": user_id})
            if existing_review:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already reviewed this app"
                )
            
            # Create review
            review = AppReview(
                app_id=app_id,
                user_id=user_id,
                username=current_user.get("username", "Anonymous"),
                rating=rating,
                comment=comment
            )
            
            await db.app_reviews.insert_one(review.dict())
            
            # Update app rating
            pipeline = [
                {"$match": {"app_id": app_id}},
                {"$group": {
                    "_id": None,
                    "avg_rating": {"$avg": "$rating"},
                    "count": {"$sum": 1}
                }}
            ]
            
            result = await db.app_reviews.aggregate(pipeline).to_list(1)
            if result:
                new_rating = result[0]["avg_rating"]
                new_count = result[0]["count"]
                
                await db.apps.update_one(
                    app_filter,
                    {
                        "$set": {
                            "rating": round(new_rating, 1),
                            "rating_count": new_count,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
            
            return {"message": "Review created successfully", "review": review}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating app review: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create review"
            )

    return router