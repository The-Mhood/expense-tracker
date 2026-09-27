from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

# Engine is created once. pool_pre_ping ensures connections are healthy at checkout
# (avoids stale connections after DB restart, important for serverless/cloud DBs
# like Neon that idle out connections).
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a SQLAlchemy session and ensures it's closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
