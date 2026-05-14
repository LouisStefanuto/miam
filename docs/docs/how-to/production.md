# Production deployment

This page covers deploying Miam to a **non-local** environment — typically a single VM or a small VPS — using the same `docker-compose.yml` that drives local development, with hardened configuration.

The architecture is unchanged: nginx (in the frontend container) serves the built React app on port `80` and proxies `/api/*` to the backend service. Postgres runs in its own container with a persistent volume.

## Target topology

```
                   ┌───────────────────────────────────┐
                   │       Reverse proxy (TLS)         │
                   │   Caddy / Traefik / nginx host    │
                   └────────────────┬──────────────────┘
                                    │ https://your-domain.com
                                    ▼
┌───────────────────────────────────────────────────────┐
│                    Docker Compose                     │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐   │
│  │  frontend  │───►│  backend   │───►│     db     │   │
│  │  (nginx)   │    │  (FastAPI) │    │ (Postgres) │   │
│  └────────────┘    └────────────┘    └────────────┘   │
└───────────────────────────────────────────────────────┘
```

The frontend container already does the `/api → backend:8000` proxy internally — your host-level reverse proxy only needs to terminate TLS and forward port `80` of the `frontend` container.

## 1. Prepare the server

Minimum requirements:

- Linux host with Docker + Docker Compose
- A DNS record pointing your domain to the server's public IP
- Open ports `80` and `443` (for the reverse proxy)
- 1 vCPU / 1 GB RAM is enough for a small instance

```bash
# On the server
git clone https://github.com/LouisStefanuto/miam.git
cd miam
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## 2. Production env vars

Edit `backend/.env`:

```env
# Strong, randomly generated values — do NOT reuse the local defaults
POSTGRES_USER=miam
POSTGRES_PASSWORD=<long-random-password>
POSTGRES_DB=recipes

DATABASE_URL=postgresql+psycopg2://miam:<long-random-password>@db:5432/recipes

JWT_SECRET_KEY=<output of: python -c "import secrets; print(secrets.token_urlsafe(48))">

GOOGLE_CLIENT_ID=<your prod client id>.apps.googleusercontent.com

# CRITICAL: lock CORS to your real frontend origin
CORS_ORIGINS=["https://your-domain.com"]
```

Edit `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=<your prod client id>.apps.googleusercontent.com
```

!!! danger "Things to double-check before going live"

    - `JWT_SECRET_KEY` is unique per environment and has never been committed.
    - `CORS_ORIGINS` lists **only** your real frontend origin(s).
    - `POSTGRES_PASSWORD` is not the default `postgres`.
    - The `.env` files are mode `600` and owned by the user running Docker.

## 3. Google OAuth for production

Reopen your OAuth client in the [Google Cloud Console](https://console.cloud.google.com):

1. Under **Authorized JavaScript origins**, add `https://your-domain.com` (in addition to any local origins you already have).
2. In **Google Auth Platform > Audience**, click **Publish app** to leave Testing mode — otherwise only emails listed under **Test users** can sign in.
3. Some apps require Google's verification flow if you request sensitive scopes; Miam only uses `openid email profile`, which is **non-sensitive** and does not need verification.

## 4. TLS termination

The JWT cookie is set with `secure=True`, so the app **only works over HTTPS** in non-local environments. Pick whichever reverse proxy you like — Caddy is the simplest because it does Let's Encrypt automatically:

```caddyfile
# /etc/caddy/Caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

Then map the frontend container to `127.0.0.1:3000` instead of `0.0.0.0:3000` — open the [`docker-compose.yml`](https://github.com/LouisStefanuto/miam/blob/main/docker-compose.yml) and change:

```yaml
frontend:
  ports:
    - "127.0.0.1:3000:80"   # only reachable from the local host (i.e. via Caddy)
```

Do the same for the `backend` and `db` services — they should not be reachable from the public internet directly.

## 5. Launch

```bash
docker compose up -d --build
```

`-d` runs the stack in the background. Tail logs to make sure migrations applied and the API booted:

```bash
docker compose logs -f backend
```

You should see:

```
Waiting for database to be ready...
Database is ready.
INFO  [alembic.runtime.migration] Running upgrade -> ...
INFO     Started server process
INFO     Application startup complete.
INFO     Uvicorn running on http://0.0.0.0:8000
```

Then verify in the browser at `https://your-domain.com`.

## 6. Backups

The database lives in the `pgdata` Docker volume. At minimum, schedule a daily dump:

```bash
# In a cron job on the host
cd /path/to/miam && make db-dump
```

That writes a timestamped `dump_YYYYMMDD_HHMMSS.sql` to the repo root. Ship it off-server to your usual backup target (S3, Backblaze, restic, etc.). Restoring is a regular `psql < dump.sql` after creating the empty database.

## 7. Updating

```bash
git pull
docker compose up -d --build
```

Migrations run automatically on backend startup. Pre-built images on Docker Hub are not published — the deployment builds from source on each update. If you want zero downtime, build images on a separate host (or in CI) and `docker compose pull` instead of `--build`.

!!! tip "Building images on a different architecture"

    The repo includes Makefile shortcuts for cross-platform builds:

    ```bash
    make amd   # build for linux/amd64
    make arm   # build for linux/arm64
    ```

    Useful when you develop on Apple Silicon but deploy to an x86 VPS.

## 8. Operations checklist

| Concern | Where it lives |
| --- | --- |
| Container logs | `docker compose logs <service>` or [Dozzle](https://dozzle.dev/) on port `9999` via `make dozzle` |
| Database backups | `make db-dump` + off-server sync (cron) |
| Secret rotation | Bump `JWT_SECRET_KEY` (logs everyone out), restart `backend` |
| Load testing | `make loadtest` against staging — never against prod |
| Resource usage | Dozzle, or `docker stats` |
| Health check | `GET /api/` and `GET /docs` should both `200` |

See also [Dev tasks](dev-tasks.md) for day-to-day operations.
