#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until python -c "
import sqlalchemy
engine = sqlalchemy.create_engine('$DATABASE_URL')
with engine.connect() as conn:
    pass
" 2>/dev/null; do
  sleep 1
done
echo "Database is ready."

alembic upgrade head
exec fastapi dev --host 0.0.0.0 src/miam/api/main.py
