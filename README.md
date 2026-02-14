<div align="center">

# miam

**A web app to organize cooking recipes and export them in printable formats to share with my family and friends.**

<img src="docs/docs/assets/images/logo.png" alt="Logo" width="25%">

[![Python 3.10-3.11-3.12-3.13](https://img.shields.io/badge/python-3.10--3.11--3.12--3.13-blue.svg)](https://www.python.org/) [![Docs](https://img.shields.io/badge/docs-available-brightgreen.svg)](./docs/)

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
- Frontend (vide-coded): Vite, TypeScript, React, shadcn-ui, Tailwind CSS
