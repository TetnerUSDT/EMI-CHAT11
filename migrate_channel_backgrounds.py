#!/usr/bin/env python3
"""
Migration script to add background_style field to existing channels
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent / 'backend'
sys.path.append(str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(backend_dir / '.env')

async def migrate_channel_backgrounds():
    """Add background_style field to existing channels"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Update all channels that don't have background_style field
        result = await db.chats.update_many(
            {
                "chat_type": "channel",
                "background_style": {"$exists": False}
            },
            {
                "$set": {
                    "background_style": "default"
                }
            }
        )
        
        print(f"✅ Successfully updated {result.modified_count} channels")
        print(f"📊 Total channels matched: {result.matched_count}")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error updating channel backgrounds: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔄 Adding background_style field to existing channels...")
    success = asyncio.run(migrate_channel_backgrounds())
    
    if success:
        print("✅ Channel background migration completed successfully!")
    else:
        print("❌ Channel background migration failed!")
        sys.exit(1)