#!/usr/bin/env python3
"""
Migration script to add owner_id and allow_all_messages fields to existing chats
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne

async def migrate_chats():
    # MongoDB connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/telegram_clone')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'telegram_clone')]
    
    try:
        # Get all chats that don't have the new fields
        chats_cursor = db.chats.find({
            "$or": [
                {"owner_id": {"$exists": False}},
                {"allow_all_messages": {"$exists": False}}
            ]
        })
        
        operations = []
        chats = await chats_cursor.to_list(None)
        
        for chat in chats:
            chat_id = chat["_id"]
            update_doc = {}
            
            # Add owner_id field if missing
            if "owner_id" not in chat:
                if chat.get("chat_type") == "channel":
                    # For channels, set owner_id to the creator
                    update_doc["owner_id"] = chat.get("created_by")
                else:
                    # For non-channels, set to None
                    update_doc["owner_id"] = None
            
            # Add allow_all_messages field if missing
            if "allow_all_messages" not in chat:
                # Default to False (admin-only)
                update_doc["allow_all_messages"] = False
            
            if update_doc:
                operations.append(
                    UpdateOne(
                        {"_id": chat_id},
                        {"$set": update_doc}
                    )
                )
        
        if operations:
            result = await db.chats.bulk_write(operations)
            print(f"Updated {result.modified_count} chats")
        else:
            print("No chats needed updating")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(migrate_chats())