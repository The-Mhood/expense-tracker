#!/usr/bin/env bash
# Render build script: install deps, run migrations.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Run migrations against DATABASE_URL (Render injects this env var for Postgres).
# `alembic upgrade head` is idempotent: it stamps the version table on fresh DBs
# and skips already-applied migrations on redeploys. Our migration uses IF NOT EXISTS
# guards so it's safe against partial prior failures too.
alembic upgrade head
