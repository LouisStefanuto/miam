"""Database session and engine configuration.

Manages SQLAlchemy engine, session factory, and database settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


class AlembicConfig(BaseSettings):
    """Pydantic settings for database connection configuration.

    Manages database connection settings loaded from environment variables
    and .env files. Uses Pydantic's BaseSettings for validation and
    configuration management with support for nested environment variable
    names using double underscore delimiters.

    Attributes:
        database_url: SQL connection string in the format
            `postgresql+psycopg2://user:password@host:port/database`.
            Defaults to a local PostgreSQL instance at localhost:5432
            with database name 'recipes'.

    Notes:
        - Environment variable names can use `__` (double underscore)
          as delimiters for nested configuration.
        - Configuration is loaded from `.env` file if present.
        - Extra environment variables are ignored.
        - Settings can be overridden via environment variables
          (e.g., `DATABASE_URL` overrides the default).
    """

    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/recipes"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
    )


alembic_config = AlembicConfig()
"""Global database configuration instance."""
engine = create_engine(alembic_config.database_url, future=True)
"""SQLAlchemy engine connected to the configured database."""

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)
"""Session factory for creating database sessions."""
