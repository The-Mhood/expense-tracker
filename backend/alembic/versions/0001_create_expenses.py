"""create expenses table

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the category enum type (PostgreSQL only; harmless on SQLite).
    category_enum = sa.Enum(
        "food", "transport", "bills", "entertainment", "other",
        name="category_enum",
    )
    category_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("incurred_date", sa.Date(), server_default=sa.func.current_date(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("category", category_enum, nullable=False),
        sa.CheckConstraint("amount > 0", name="ck_expense_amount_positive"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("expenses")
    sa.Enum(name="category_enum").drop(op.get_bind(), checkfirst=True)
