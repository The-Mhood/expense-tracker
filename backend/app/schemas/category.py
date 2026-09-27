from pydantic import BaseModel

from ..enums.category import Category


class CategoryListResponse(BaseModel):
    categories: list[Category]
