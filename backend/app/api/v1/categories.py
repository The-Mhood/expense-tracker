from fastapi import APIRouter

from ...enums.category import Category
from ...schemas.category import CategoryListResponse

router = APIRouter()


@router.get("", response_model=CategoryListResponse, summary="List all allowed expense categories")
def list_categories() -> CategoryListResponse:
    return CategoryListResponse(categories=list(Category))
