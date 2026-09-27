"""create expenses table

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the category enum type if it doesn't already exist (e.g. from a
    # previous partial migration). Use IF NOT EXISTS via raw DDL so redeploys
    # to Neon/Render are idempotent.
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute(
            "DO $$ BEGIN "
            "CREATE TYPE category_enum AS ENUM ('food', 'transport', 'bills', 'entertainment', 'other'); "
            "EXCEPTION WHEN duplicate_object THEN null; "
            "END $$;"
        )
        category_type = postgresql.ENUM(
            "food", "transport", "bills", "entertainment", "other",
            name="category_enum",
            create_type=False,  # already created above (or already existed)
        )
    else:
        # SQLite: no native ENUM; SQLAlchemy will use a VARCHAR under the hood.
        category_type = sa.Enum(
            "food", "transport", "bills", "entertainment", "other",
            name="category_enum",
        )

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("category", category_type, nullable=False),
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
        sa.CheckConstraint("amount > 0", name="ck_expense_amount_positive"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("expenses")
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS category_enum;")
