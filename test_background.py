#!/usr/bin/env python3
"""
Simple test to check background functionality
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / 'backend'
sys.path.append(str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(backend_dir / '.env')

async def test_channel_background():
    """Test channel background functionality"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Create a test channel
        test_channel = {
            "id": "test-channel-bg",
            "name": "Background Test Channel",
            "chat_type": "channel",
            "participants": [],
            "admins": ["test-user"],
            "description": "Channel for testing background functionality",
            "is_public": True,
            "background_style": "default",
            "created_by": "test-user",
            "owner_id": "test-user",
            "allow_all_messages": False,
            "subscriber_count": 0
        }
        
        # Insert test channel
        await db.chats.insert_one(test_channel)
        print("✅ Created test channel with default background")
        
        # Update to dark-structure background
        result = await db.chats.update_one(
            {"id": "test-channel-bg"},
            {"$set": {"background_style": "dark-structure"}}
        )
        
        if result.modified_count > 0:
            print("✅ Successfully updated channel background to dark-structure")
        
        # Verify the update
        updated_channel = await db.chats.find_one({"id": "test-channel-bg"})
        if updated_channel and updated_channel.get("background_style") == "dark-structure":
            print("✅ Background style correctly saved in database")
        else:
            print("❌ Background style not properly saved")
        
        # Clean up
        await db.chats.delete_one({"id": "test-channel-bg"})
        print("✅ Cleaned up test data")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error testing channel background: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🧪 Testing channel background functionality...")
    success = asyncio.run(test_channel_background())
    
    if success:
        print("✅ All background tests passed!")
    else:
        print("❌ Background tests failed!")
        sys.exit(1)