# miam

## Install

Install dependencies and setup virtual environment. Requires [`uv`](https://docs.astral.sh/uv/getting-started/installation/) installed.

```bash
make install
```

## Run

Launch project using `docker compose`.

```bash
make start
```

Stop project.

```bash
make stop
```

## Dev

Run pre-commit checks over the entire repo.

```bash
make pre-commit
```

## Architecture

- Containerization: Docker Compose
- Backend: PostgreSQL, FastAPI, SqlAlchemy, Alembic, Python
- Frontend: WIP
