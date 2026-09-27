import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from .api.v1 import router as v1_router
from .config import settings

logger = logging.getLogger("expense_tracker")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Expense Tracker API", version="1.0.0")

# CORS: allow the configured frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Catch any unhandled database error, log it for debugging, and return a clean JSON 503."""
    # Log the real error so Render logs show what actually went wrong.
    logger.exception("Database error during %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=503,
        content={"detail": "Database is temporarily unavailable, please try again shortly."},
    )


@app.get("/health", tags=["health"], summary="Health check")
def health() -> dict[str, str]:
    return {"status": "ok"}


# Mount the v1 API router
app.include_router(v1_router, prefix="/api/v1")


# Allow running via ``python -m app.main`` for Render/Heroku-style platforms
if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)
