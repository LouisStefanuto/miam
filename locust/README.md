# Load Tests

Load testing for the Miam recipe API using [Locust](https://locust.io/).

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/)
- Miam backend running (via `docker compose up` or `make start` from project root)

## Setup

```bash
cd locust
uv sync
```

## Running

### Web UI mode

```bash
cd locust
uv run locust -f locustfile.py --host http://localhost:8000
```

Then open http://localhost:8089 in your browser. Configure users and spawn rate in the UI.

### Headless mode

```bash
cd locust
uv run locust -f locustfile.py --headless -u 50 -r 5 --run-time 2m --host http://localhost:8000
```

### Via Makefile (from project root)

```bash
make loadtest           # Web UI mode
make loadtest-headless  # 50 users, 5/s spawn, 2 min run
```

## Traffic Profile

| Task | Weight | Endpoint |
|------|--------|----------|
| List recipes | 20 | `GET /api/recipes` |
| Search recipes | 15 | `GET /api/recipes/search` |
| Get recipe | 10 | `GET /api/recipes/{id}` |
| Health check | 5 | `GET /` |
| Create recipe | 5 | `POST /api/recipes` |
| Upload image | 3 | `POST /api/images` |
| Get image | 3 | `GET /api/images/{id}` |
| Update recipe | 2 | `PUT /api/recipes/{id}` |
| Delete recipe | 1 | `DELETE /api/recipes/{id}` |
| Delete image | 1 | `DELETE /api/images/{id}` |
| Export markdown | 1 | `POST /api/export/markdown` |
| Export word | 1 | `POST /api/export/word` |

~79% reads, ~15% writes, ~6% deletes + exports.
