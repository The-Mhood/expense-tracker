#!/usr/bin/env bash
# Render build script: install deps, run migrations.
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Run migrations against DATABASE_URL (Render injects this env var for Postgres).
alembic upgrade head
