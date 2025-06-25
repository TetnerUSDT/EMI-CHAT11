#!/usr/bin/env python3
"""
Script to reset all users' trust_score to 0 in the database
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent
sys.path.append(str(backend_dir))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv(backend_dir / '.env')

async def reset_trust_scores():
    """Reset all users' trust_score to 0"""
    try:
        # Connect to MongoDB
        mongo_url = os.environ['MONGO_URL']
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ['DB_NAME']]
        
        # Update all users' trust_score to 0
        result = await db.users.update_many(
            {},  # Empty filter matches all documents
            {"$set": {"trust_score": 0, "updated_at": {"$currentDate": True}}}
        )
        
        print(f"✅ Successfully updated {result.modified_count} users")
        print(f"📊 Total users matched: {result.matched_count}")
        
        # Close connection
        client.close()
        
    except Exception as e:
        print(f"❌ Error updating trust scores: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🔄 Resetting all users' trust scores to 0...")
    success = asyncio.run(reset_trust_scores())
    
    if success:
        print("✅ Trust score reset completed successfully!")
    else:
        print("❌ Trust score reset failed!")
        sys.exit(1)