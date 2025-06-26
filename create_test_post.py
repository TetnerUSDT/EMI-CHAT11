#!/usr/bin/env python3
"""
Script to create a test post for demonstrating the new channel post design
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

# Load environment variables
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

async def create_test_post():
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    try:
        # Use the existing channel
        channel_id = "685d78b670a4243fd28e2538"
        print(f"Using existing channel: {channel_id}")
        
        # Create a test post with the new design
        test_post = {
            "id": str(uuid.uuid4()),
            "channel_id": channel_id,
            "author_id": "685d78470aec9852fb847dcf",
            "text": "🎉 Обновление дизайна новостей в канале!\n\nТеперь все новости отображаются в компактных карточках с красивым оформлением.",
            "media_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
            "media_type": "image",
            "post_type": "media",
            "reactions": {},
            "views": 1250,
            "comments_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.posts.insert_one(test_post)
        print(f"Created test post: {test_post['id']}")
        
        # Update channel with last post info
        await db.chats.update_one(
            {"id": channel_id},
            {
                "$set": {
                    "last_message_id": test_post["id"],
                    "last_message_time": test_post["created_at"],
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        print("Test post created successfully!")
        print(f"Channel ID: {channel_id}")
        print(f"Post ID: {test_post['id']}")
        
    except Exception as e:
        print(f"Error creating test post: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_test_post())