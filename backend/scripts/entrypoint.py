import os
import time

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@db:5432/recipes"
)


def wait_for_db(url: str, retries: int = 30, delay: int = 1):
    """Wait until the database is ready to accept connections."""
    engine = create_engine(url)
    for attempt in range(1, retries + 1):
        try:
            with engine.connect():
                print(f"[{attempt}] Database is ready!")
                return
        except Exception:
            print(f"[{attempt}] Database not ready, waiting {delay}s...")
            time.sleep(delay)
    raise Exception("Database not available after waiting.")


def run_migrations():
    """Run Alembic migrations using your env.py setup."""
    print("Running Alembic migrations...")
    alembic_cfg = Config("alembic.ini")  # env.py will read DATABASE_URL from env
    command.upgrade(alembic_cfg, "head")
    print("Migrations complete!")


if __name__ == "__main__":
    wait_for_db(DATABASE_URL)
    run_migrations()
