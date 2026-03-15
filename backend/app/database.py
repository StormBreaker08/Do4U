from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─── Database URL ────────────────────────────────────────────────────────────
# Supabase exposes two pooler ports:
#   :5432 — session pooler   (Supavisor session mode)  — supports prepared stmts
#   :6543 — transaction pooler (Supavisor transaction mode) — does NOT support
#           asyncpg prepared statements → causes DuplicatePreparedStatementError
#
# We MUST stay on port 5432. Switching to 6543 causes 500s on every DB call
# because pool_pre_ping fires `select pg_catalog.version()` as a prepared
# statement which PgBouncer in transaction mode cannot handle.
db_url = settings.DATABASE_URL
# Safety: if someone set 6543 explicitly, revert to 5432
if "pooler.supabase.com:6543" in db_url:
    db_url = db_url.replace("pooler.supabase.com:6543", "pooler.supabase.com:5432")

# Create async engine
# Increased timeouts for Render's PostgreSQL connection stability
engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=3,  # Reduced from 5 for Render's limited resources
    max_overflow=5,  # Reduced from 10
    pool_timeout=60,  # Increased from 30 to 60 seconds
    pool_recycle=300,
    connect_args={
        "timeout": 60,  # Increased from 30 to 60 seconds for connection establishment
        "statement_cache_size": 0,  # Disable asyncpg prepared-statement cache
        "command_timeout": 60,  # Command timeout for queries
        "server_settings": {
            "application_name": "do4u-backend",
            "jit": "off"  # Disable JIT compilation for faster query planning
        }
    },
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Create base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()


async def init_db():
    """Initialize database connection"""
    try:
        # Test database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS skill_proofs JSONB"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS document_path VARCHAR"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS verification_status VARCHAR"))
            await conn.execute(text("ALTER TABLE IF EXISTS genies ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE"))
            # Create genie_locations table for live tracking
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS genie_locations (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
                    genie_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    latitude NUMERIC(10, 8) NOT NULL,
                    longitude NUMERIC(11, 8) NOT NULL,
                    accuracy NUMERIC(6, 2),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            # Create index for faster lookups
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_genie_locations_job_id ON genie_locations(job_id)
            """))
            # Keep only the latest location row per job, then enforce uniqueness
            await conn.execute(text("""
                DELETE FROM genie_locations
                WHERE id IN (
                    SELECT id FROM (
                        SELECT
                            id,
                            ROW_NUMBER() OVER (
                                PARTITION BY job_id
                                ORDER BY updated_at DESC, id DESC
                            ) AS rn
                        FROM genie_locations
                    ) ranked
                    WHERE ranked.rn > 1
                )
            """))
            await conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS uq_genie_locations_job_id
                ON genie_locations(job_id)
            """))
        logger.info("Database connection established successfully")
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        logger.info("Application will continue without database connection")


async def close_db():
    """Close database connection"""
    await engine.dispose()
