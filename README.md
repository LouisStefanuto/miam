<div align="center">

# miam

[![Python 3.10-3.11-3.12-3.13](https://img.shields.io/badge/python-3.10--3.11--3.12--3.13-blue.svg)](https://www.python.org/) [![Docs](https://img.shields.io/badge/docs-available-brightgreen.svg)](./docs/)

**A web app to organize cooking recipes and export them in printable formats to share with my family and friends.**

[**Install**](#install) • [**Run**](#run) • [**Dev**](#dev)

</div>

---

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
