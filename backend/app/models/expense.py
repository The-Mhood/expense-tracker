from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, Date, DateTime, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


CATEGORY_VALUES = ("food", "transport", "bills", "entertainment", "other")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    # Use VARCHAR instead of Postgres ENUM to avoid driver-specific enum-binding
    # issues across psycopg/psycopg2. Validation to the fixed set of categories
    # happens in Pydantic (schemas/expense.py) and via the CHECK constraint below.
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    incurred_date: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_expense_amount_positive"),
        CheckConstraint(
            f"category IN {CATEGORY_VALUES}",
            name="ck_expense_category_valid",
        ),
    )
