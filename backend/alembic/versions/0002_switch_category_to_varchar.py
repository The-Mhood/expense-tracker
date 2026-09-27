"""migrate category column from enum to varchar (no-op for fresh installs)

Revision ID: 0002
Revises: 0001
Create Date: 2024-01-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    # If category_enum type exists AND the expenses.category column is of that
    # enum type, cast to VARCHAR and drop the enum. This handles Neon/Render
    # databases that saw the original enum-based migration before we switched
    # to VARCHAR. For fresh databases (where 0001 already used VARCHAR) this is
    # a no-op because there is no category_enum to drop.
    op.execute(
        "DO $$ "
        "BEGIN "
        "  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_enum') THEN "
        "    ALTER TABLE expenses ALTER COLUMN category TYPE VARCHAR(32) USING category::text; "
        "    DROP TYPE category_enum; "
        "  END IF; "
        "END $$;"
    )
    # Ensure CHECK constraint exists (it won't if the original 0001 migration
    # created the table with ENUM instead of VARCHAR).
    op.execute(
        "DO $$ "
        "BEGIN "
        "  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_expense_category_valid') THEN "
        "    ALTER TABLE expenses ADD CONSTRAINT ck_expense_category_valid "
        "    CHECK (category IN ('food','transport','bills','entertainment','other')); "
        "  END IF; "
        "END $$;"
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    op.execute("ALTER TABLE expenses DROP CONSTRAINT IF EXISTS ck_expense_category_valid")
    op.execute(
        "DO $$ BEGIN "
        "CREATE TYPE category_enum AS ENUM ('food','transport','bills','entertainment','other'); "
        "EXCEPTION WHEN duplicate_object THEN null; "
        "END $$;"
    )
    op.execute(
        "ALTER TABLE expenses ALTER COLUMN category TYPE category_enum "
        "USING category::text::category_enum"
    )
