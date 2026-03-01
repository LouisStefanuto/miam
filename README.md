<div align="center">

# miam

**A web app to organize cooking recipes and export them in printable formats to share with my family and friends.**

<img src="docs/docs/assets/images/logo.png" alt="Logo" width="25%">

[![Docs](https://img.shields.io/badge/docs-available-brightgreen.svg)](./docs/)
[![Coverage](https://codecov.io/gh/LouisStefanuto/miam/branch/main/graph/badge.svg)](https://codecov.io/gh/LouisStefanuto/miam)

[**Install**](#install) • [**Run**](#run) • [**Docs**](https://louisstefanuto.github.io/miam/) • [**Dev**](#dev)

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

## Documentation

The project's documentation is available on [**GitHub Pages**](https://louisstefanuto.github.io/miam/).

To preview your documentation in real-time while editing, run:

```bash
make docs
```

## Dev

Before pushing to this repo, please setup pre-commit.

```bash
uv tool install pre-commit
pre-commit install --hook-type commit-msg --hook-type pre-push
```

When running the project containers, monitor container resource usage with [Dozzle](https://dozzle.dev/guide/what-is-dozzle).

```bash
make dozzle
```

For performance results under load testing, see the [Locust section](./locust/README.md).

## Architecture

- Containerization: Docker Compose, Docker, Dozzle for container resource monitoring
- Backend: PostgreSQL, FastAPI, SqlAlchemy, Alembic, Python
- Frontend (vibe-coded): React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Load testing: Locust
