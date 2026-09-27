from fastapi import APIRouter

from .categories import router as categories_router
from .expenses import router as expenses_router

router = APIRouter()
router.include_router(categories_router, prefix="/categories", tags=["categories"])
router.include_router(expenses_router, prefix="/expenses", tags=["expenses"])
