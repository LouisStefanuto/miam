<div align="center">

# miam

[![Python 3.10-3.11-3.12-3.13](https://img.shields.io/badge/python-3.10--3.11--3.12--3.13-blue.svg)](https://www.python.org/) [![Docs](https://img.shields.io/badge/docs-available-brightgreen.svg)](./docs/)

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
