<div align="center">

# miam - docs

[![MkDocs Material](https://img.shields.io/badge/MkDocs_Material-526CFE?logo=materialformkdocs&logoColor=white)](https://squidfunk.github.io/mkdocs-material/)
[![mkdocstrings](https://img.shields.io/badge/mkdocstrings-526CFE?logo=python&logoColor=white)](https://mkdocstrings.github.io/)
[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

**Documentation site of `miam`**

[**Install**](#install) • [**Run**](#run) • [**Build**](#build)

</div>

---

## Install

Create a virtual environment:

```bash
uv venv .venv --python 3.13
uv sync
```

## Run

Serve the docs locally with live reload:

```bash
uv run mkdocs serve
```

Then open [http://localhost:8000](http://localhost:8000).

## Build

Generate the static site:

```bash
uv run mkdocs build
```

The output is written to the `site/` directory.
