<div align="center">

# miam - backend

[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Alembic](https://img.shields.io/badge/Alembic-6BA81E?logo=python&logoColor=white)](https://alembic.sqlalchemy.org/)
[![Pydantic](https://img.shields.io/badge/Pydantic-E92063?logo=pydantic&logoColor=white)](https://docs.pydantic.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

**Python backend of `miam`**

[**Install**](#install) • [**Run**](#run)

</div>

---

## Install

Create a virtual environment:

```bash
uv venv .venv --python 3.13
uv sync
```

To include development dependencies:

```bash
uv sync --extra dev
```

## Run

- **Option 1 - Docker (recommended)**

    - To launch the backend only, start the `db` and `backend` services, defined in the [`docker-compose.yml`](../docker-compose.yml) in the root folder.

        ```bash
        cd ..
        docker compose up db backend
        ```

- **Option 2 - Manual**

    - Activate your virtual environment.

        ```bash
        source .venv/bin/activate
        ```

    - Start your SQL server.

    - Update the database schema. This will create the tables if they don't exist yet.

        ```bash
        alembic upgrade head
        ```

    - Launch the backend :

        ```bash
        uvicorn miam.api.main:app --host 0.0.0.0 --port 8000 --reload
        ```
