# Dev tasks

Day-to-day commands and a troubleshooting reference.

## Run the test suite

```bash
cd backend
uv run pytest
```

## Lint and format the backend

```bash
cd backend
uv run ruff check --fix
uv run ruff format
```

## Install pre-commit hooks

Required before pushing to the repo:

```bash
uv tool install pre-commit
pre-commit install --hook-type commit-msg --hook-type pre-push
```

Run them over the entire codebase:

```bash
make pre-commit
```

## Preview the documentation

```bash
make docs
```

Docs are served on [http://localhost:8001](http://localhost:8001) with live reload on changes to `backend/src/`.

## Monitor containers

```bash
make dozzle
```

Then open [http://localhost:9999](http://localhost:9999) for [Dozzle](https://dozzle.dev/)'s live container logs.

## Dump the database

```bash
make db-dump
```

Writes a timestamped `dump_YYYYMMDD_HHMMSS.sql` to the repo root.

## Load testing

```bash
make loadtest             # interactive Locust UI on :8089
make loadtest-headless    # 50 users, 5/s ramp, 2 min
```

See `locust/README.md` for details. **Run against a staging environment, never production.**

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `connection refused` from backend on first start | Postgres not ready yet | Wait a few seconds — the backend has a `depends_on: service_healthy` guard, but on slow machines it can still race |
| `401 Unauthorized` after sign-in | `GOOGLE_CLIENT_ID` mismatch between frontend and backend, or your email is not a Google Auth **Test user** | Re-check both `.env` files; add your account under **Audience > Test users** |
| Google popup shows `origin not allowed` | The frontend URL is not in the OAuth client's allowed origins | Add the exact origin (scheme + host + port) in Google Cloud Console |
| Browser request blocked by CORS | `CORS_ORIGINS` in `backend/.env` does not list the frontend origin | Add the frontend origin to `CORS_ORIGINS` and restart the backend |
| Cookie not sent on production | Frontend served over HTTP, but the cookie is `secure=True` | Put the site behind HTTPS (see [Production deployment](production.md#4-tls-termination)) |
| `make install` fails on `uv sync` | Python 3.13 not available to `uv` | Run `uv python install 3.13` |
| Database schema looks stale | Old volume from a previous schema | `make clean` (drops the `pgdata` volume), then `make start`. **Do NOT run this in production** — it deletes the database |
| Port 3000/8000/5432 already in use | Another process is bound | Stop the conflicting process or change the host-side port mapping in `docker-compose.yml` |
| Image build slow on Apple Silicon, deploying to x86 | Default build matches host arch | Use `make amd` to build `linux/amd64` images |

Container logs are usually the fastest way to diagnose runtime issues:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```
