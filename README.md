<div align="center">

# miam

**A web app to organize cooking recipes and export them in printable formats to share with my family and friends.**

<img src="docs/docs/assets/images/logo.png" alt="Logo" width="25%">

[![Docs](https://img.shields.io/badge/docs-available-brightgreen.svg)](./docs/)

[**Install**](#install) • [**Run**](#run) • [**Dev**](#dev) • [**Docs**](https://louisstefanuto.github.io/miam/)

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

Run pre-commit checks over the entire repo.

```bash
make pre-commit
```

## Architecture

- Containerization: Docker Compose
- Backend: PostgreSQL, FastAPI, SqlAlchemy, Alembic, Python
- Frontend (vibe-coded): React, TypeScript, Vite, Tailwind CSS, shadcn/ui
