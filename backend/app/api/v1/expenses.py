from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...crud import expense as expense_crud
from ...database import get_db
from ...schemas.expense import ExpenseCreate, ExpenseListResponse, ExpenseResponse, ExpenseUpdate

router = APIRouter()


@router.get("", response_model=ExpenseListResponse, summary="List expenses (paginated)")
def list_expenses(
    limit: int = Query(
        default=expense_crud.DEFAULT_LIST_LIMIT,
        ge=1,
        le=expense_crud.MAX_LIST_LIMIT,
        description=f"Page size (1-{expense_crud.MAX_LIST_LIMIT})",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Number of rows to skip (for pagination)",
    ),
    db: Session = Depends(get_db),
) -> ExpenseListResponse:
    items, total = expense_crud.list_expenses(db, limit=limit, offset=offset)
    return ExpenseListResponse(expenses=items, total=total, limit=limit, offset=offset)


@router.get(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Get a single expense by ID",
    responses={404: {"description": "Expense not found"}},
)
def get_expense(expense_id: int, db: Session = Depends(get_db)) -> ExpenseResponse:
    expense = expense_crud.get_expense(db, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.post(
    "",
    response_model=ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new expense",
)
def create_expense(payload: ExpenseCreate, db: Session = Depends(get_db)) -> ExpenseResponse:
    return expense_crud.create_expense(
        db,
        amount=payload.amount,
        category=payload.category,
        incurred_date=payload.incurred_date,
        description=payload.description,
    )


@router.put(
    "/{expense_id}",
    response_model=ExpenseResponse,
    summary="Update an existing expense (full replacement)",
    responses={404: {"description": "Expense not found"}},
)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
) -> ExpenseResponse:
    expense = expense_crud.get_expense(db, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense_crud.update_expense(
        db,
        expense=expense,
        amount=payload.amount,
        category=payload.category,
        incurred_date=payload.incurred_date,
        description=payload.description,
    )


@router.delete(
    "/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an expense",
    responses={404: {"description": "Expense not found"}},
)
def delete_expense(expense_id: int, db: Session = Depends(get_db)) -> None:
    expense = expense_crud.get_expense(db, expense_id)
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    expense_crud.delete_expense(db, expense=expense)
