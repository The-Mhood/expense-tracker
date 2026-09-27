from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..enums.category import Category


class ExpenseBase(BaseModel):
    """Shared fields between create/update/response schemas."""
    model_config = ConfigDict(json_encoders={Decimal: str})

    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Positive decimal amount")
    category: Category
    incurred_date: date = Field(default_factory=date.today, description="Date the expense occurred")
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("amount", mode="before")
    @classmethod
    def coerce_amount_to_decimal(cls, v: object) -> Decimal:
        """Coerce int/float/string input to Decimal; reject non-decimal values.

        Catches Decimal parse errors (e.g. "$1,234.56" sent by a buggy client)
        and raises ValueError so Pydantic returns a clean 422 instead of a 500.
        """
        try:
            if isinstance(v, float):
                return Decimal(str(v)).quantize(Decimal("0.01"))
            if isinstance(v, str | int):
                return Decimal(v).quantize(Decimal("0.01"))
            if isinstance(v, Decimal):
                return v.quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError, ArithmeticError):
            pass
        raise ValueError("amount must be a valid decimal number greater than 0 (e.g. 12.50)")

    @field_validator("category", mode="before")
    @classmethod
    def coerce_category(cls, v: Any) -> Category:
        """Normalize category input to the correct enum member.

        Accepts:
        - the canonical lowercase value ("food")
        - the Python enum member name in any case ("FOOD", "Food")
        - any weird casing ("Food", "TRANSPORT")

        Without this, sending "FOOD" (member name) would match the enum on
        the Python side but SQLAlchemy would serialize it as "FOOD" (the name)
        instead of "food" (the value), causing Postgres to reject it with
        'invalid input value for enum category_enum'.
        """
        if isinstance(v, Category):
            return v
        if isinstance(v, str):
            lower = v.strip().lower()
            for member in Category:
                if lower == member.value or lower == member.name.lower():
                    return member
        raise ValueError(
            f"category must be one of: {', '.join(m.value for m in Category)}"
        )


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseResponse(BaseModel):
    """Schema for API responses."""
    model_config = ConfigDict(from_attributes=True, json_encoders={Decimal: str})

    id: int
    amount: Decimal
    category: Category
    incurred_date: date
    description: str | None
    created_at: datetime
    updated_at: datetime


class ExpenseListResponse(BaseModel):
    """Paginated list response. total = total matching rows (ignoring limit/offset)."""
    expenses: list[ExpenseResponse]
    total: int
    limit: int
    offset: int
