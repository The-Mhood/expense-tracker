from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from ..enums.category import Category
from ..models.expense import Expense

# Safe upper bound so a client can't request the entire table at once.
MAX_LIST_LIMIT = 200
DEFAULT_LIST_LIMIT = 100


def list_expenses(
    db: Session,
    *,
    limit: int = DEFAULT_LIST_LIMIT,
    offset: int = 0,
) -> tuple[list[Expense], int]:
    """Return (expenses_page, total_count), ordered by incurred_date desc.

    Uses a single COUNT() over the filtered set to return pagination metadata
    without loading all rows into memory. ``limit`` is clamped to MAX_LIST_LIMIT.
    """
    if limit < 1:
        limit = DEFAULT_LIST_LIMIT
    if limit > MAX_LIST_LIMIT:
        limit = MAX_LIST_LIMIT
    if offset < 0:
        offset = 0

    total_stmt = select(func.count()).select_from(Expense)
    total = int(db.scalar(total_stmt) or 0)

    stmt = (
        select(Expense)
        .order_by(Expense.incurred_date.desc(), Expense.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = list(db.scalars(stmt).all())
    return items, total


def get_expense(db: Session, expense_id: int) -> Expense | None:
    """Return a single expense by ID, or None if it doesn't exist."""
    return db.get(Expense, expense_id)


def _commit_or_rollback(db: Session) -> None:
    """Commit; roll back and re-raise on failure. Prevents poisoned connections
    from being returned to the pool after an aborted transaction."""
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise


def create_expense(
    db: Session,
    *,
    amount: Decimal,
    category: Category,
    incurred_date: date,
    description: str | None,
) -> Expense:
    """Insert a new expense, commit, and return the refreshed ORM instance."""
    expense = Expense(
        amount=amount,
        category=category,
        incurred_date=incurred_date,
        description=description,
    )
    db.add(expense)
    _commit_or_rollback(db)
    db.refresh(expense)
    return expense


def update_expense(
    db: Session,
    *,
    expense: Expense,
    amount: Decimal,
    category: Category,
    incurred_date: date,
    description: str | None,
) -> Expense:
    """Update an existing expense with the given values, commit, and refresh."""
    expense.amount = amount
    expense.category = category
    expense.incurred_date = incurred_date
    expense.description = description
    _commit_or_rollback(db)
    db.refresh(expense)
    return expense


def delete_expense(db: Session, *, expense: Expense) -> None:
    """Delete the given expense and commit."""
    db.delete(expense)
    _commit_or_rollback(db)
