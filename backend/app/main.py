from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
from pathlib import Path
import asyncio

from app.database import init_db
from app.routes import jobs, offers, wallet, admin, users, notifications, chat, location
from app.utils.exceptions import BaseAPIException


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    await init_db()
    yield


ALLOWED_ORIGINS = [
    "https://do4u.vercel.app",
    "https://do4u-git-main-stormbreaker08s-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]

app = FastAPI(
    title="Do4U Backend",
    description="Backend API for Do4U service marketplace",
    version="1.0.0",
    lifespan=lifespan
)

uploads_root = Path(__file__).resolve().parents[1] / "uploads"
uploads_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_root)), name="uploads")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _cors_headers(request: Request) -> dict:
    """
    Return CORS headers for error responses.

    FastAPI exception handlers run *outside* the CORSMiddleware stack, so
    error responses (4xx / 5xx) are returned without the
    Access-Control-Allow-Origin header, which causes browsers to report a
    CORS error instead of the real error. We fix this by manually adding the
    header when the request origin is in our allow-list.
    """
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS:
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


# Setup exception handlers
@app.exception_handler(BaseAPIException)
async def api_exception_handler(request: Request, exc: BaseAPIException):
    """Handle custom API exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        headers=_cors_headers(request),
        content={
            "error": True,
            "message": exc.message,
            "type": exc.__class__.__name__
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        headers=_cors_headers(request),
        content={
            "error": True,
            "message": exc.detail,
            "type": "HTTPException"
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with actionable details"""
    return JSONResponse(
        status_code=422,
        headers=_cors_headers(request),
        content={
            "error": True,
            "message": "Request validation failed",
            "type": "RequestValidationError",
            "details": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    # Check if it's a timeout error (database connection timeout)
    if isinstance(exc, (asyncio.TimeoutError, TimeoutError)):
        logging.error(f"Database connection timeout: {exc}", exc_info=True)
        return JSONResponse(
            status_code=503,
            headers=_cors_headers(request),
            content={
                "error": True,
                "message": "Database connection timeout. Please try again.",
                "type": "TimeoutError"
            }
        )
    
    logging.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        headers=_cors_headers(request),
        content={
            "error": True,
            "message": "Internal server error",
            "type": "InternalServerError"
        }
    )

# Include routers
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(location.router, prefix="/api/v1/jobs", tags=["location"])
app.include_router(offers.router, prefix="/api/v1/offers", tags=["offers"])
app.include_router(wallet.router, prefix="/api/v1/wallet", tags=["wallet"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(chat.router, tags=["chat"])


@app.get("/")
async def root():
    return {"message": "Do4U Backend API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint - tests database connectivity"""
    from app.database import AsyncSessionLocal
    from sqlalchemy import text
    
    try:
        # Try to get a database session and run a simple query
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except asyncio.TimeoutError:
        return {
            "status": "degraded",
            "database": "timeout",
            "message": "Database connection timeout"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

