#!/usr/bin/env python
"""Test database connection and basic operations"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_connection():
    from app.database import engine, AsyncSessionLocal
    from app.models.user import User
    from sqlalchemy import select
    import uuid
    
    print("Testing database connection...")
    
    try:
        # Test basic connection
        async with engine.begin() as conn:
            result = await conn.execute("SELECT 1")
            print("✅ Basic connection successful")
        
        # Test session and query
        async with AsyncSessionLocal() as session:
            # Try to query users
            result = await session.execute(select(User))
            users = result.scalars().all()
            print(f"✅ Query successful - Found {len(users)} users")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await engine.dispose()
        print("✅ Connection closed")

if __name__ == "__main__":
    asyncio.run(test_connection())
