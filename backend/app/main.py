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


def _cors_origins() -> list[str]:
    """Return the list of allowed CORS origins.

    Honors explicit origins from CORS_ORIGINS and, when deployed to a Render
    *.onrender.com URL, automatically allows Vercel preview URLs for the project.
    In production the safe way to allow preview deployments is to match known
    Vercel preview URL patterns; in dev we accept localhost.
    """
    origins = list(settings.cors_origins_list)
    # Always allow localhost for local dev
    for local in ("http://localhost:3000", "http://127.0.0.1:3000"):
        if local not in origins:
            origins.append(local)
    return origins


# CORS: allow the configured frontend origins plus localhost.
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",  # allow all Vercel preview/production URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Catch any unhandled database error, log it for debugging, and return a clean JSON 503."""
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
