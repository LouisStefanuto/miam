from miam.infra.db.session import AlembicConfig
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

DATABASE_URL = AlembicConfig().database_url


def test_connection() -> None:
    try:
        engine = create_engine(DATABASE_URL, echo=False)

        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Connection successful, result:", result.scalar())

    except SQLAlchemyError as e:
        print("❌ Connection failed:")
        print(e)


if __name__ == "__main__":
    test_connection()
