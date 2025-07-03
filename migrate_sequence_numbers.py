import asyncio
import sys
import os
sys.path.append('/app')

from backend.database import db, get_database
from datetime import datetime

async def migrate_posts_sequence_numbers():
    """Add sequence_number to existing posts"""
    print("🔄 Starting migration: adding sequence_number to existing posts...")
    
    # Get all channels
    channels = await db.chats.find({"chat_type": "channel"}).to_list(length=None)
    
    for channel in channels:
        channel_id = str(channel["_id"])
        channel_name = channel.get("name", "Unknown")
        
        print(f"\n📂 Processing channel: {channel_name} ({channel_id})")
        
        # Get all posts for this channel sorted by creation time
        posts = await db.posts.find(
            {"channel_id": channel_id}
        ).sort("created_at", 1).to_list(length=None)  # Ascending order (oldest first)
        
        print(f"   Found {len(posts)} posts")
        
        if not posts:
            continue
            
        # Assign sequence numbers starting from 1
        updated_count = 0
        for i, post in enumerate(posts, 1):
            current_seq = post.get("sequence_number", 0)
            
            if current_seq == 0 or current_seq is None:
                # Update post with sequence number
                result = await db.posts.update_one(
                    {"_id": post["_id"]},
                    {"$set": {"sequence_number": i}}
                )
                if result.modified_count > 0:
                    updated_count += 1
                    print(f"   ✅ Updated post {post['_id']} -> sequence #{i}")
        
        print(f"   📊 Updated {updated_count} posts in channel {channel_name}")
    
    print("\n✅ Migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_posts_sequence_numbers())