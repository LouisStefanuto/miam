# Local development

Two paths are supported: **Docker Compose** (recommended — what CI uses) and **manual** (run backend/frontend directly on your host, useful for fast iteration and debugging).

## Path A — Docker Compose (recommended)

This starts three containers: `db` (Postgres 16), `backend` (FastAPI on `:8000`), and `frontend` (nginx serving the built React app on `:3000`).

```bash
make start
```

That is a shortcut for `docker compose up --build`. The first build takes a few minutes; subsequent boots are seconds.

Once the containers are healthy:

| Service | URL |
| --- | --- |
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend (OpenAPI / Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Backend (ReDoc) | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| Postgres | `localhost:5432` (user/db from your `.env`) |

Stop everything:

```bash
make stop
```

Wipe containers **and the database volume** (useful for a clean reinstall):

```bash
make clean
```

!!! info "Database migrations"

    Alembic migrations are applied automatically by the backend container's entrypoint at startup — you do not need to run `alembic upgrade head` manually when using Docker.

## Path B — Manual

Use this when you want auto-reload on every save without rebuilding the container.

### 1. Database

You still need a Postgres instance. The easiest option is to start only the `db` service from Docker Compose:

```bash
docker compose up db
```

Then update `backend/.env` so `DATABASE_URL` points to your host's database:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/recipes
```

### 2. Backend

Install dependencies and create the virtual environment:

```bash
make install
```

This runs `uv sync --all-extras` inside `backend/`. Then apply the migrations and start the API:

```bash
cd backend
uv run alembic upgrade head
uv run uvicorn miam.api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API is now live at [http://localhost:8000](http://localhost:8000) with auto-reload on code changes.

### 3. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite serves the app on [http://localhost:5173](http://localhost:5173) by default.

!!! warning "Two more steps when running Vite directly"

    - Add `http://localhost:5173` to the OAuth client's **Authorized JavaScript origins** in Google Cloud Console.
    - Add `http://localhost:5173` to `CORS_ORIGINS` in `backend/.env`, otherwise the backend will reject the frontend's requests.

## Verify the install

Quick checklist to confirm everything is wired up:

1. Open [http://localhost:3000](http://localhost:3000) (Docker) or [http://localhost:5173](http://localhost:5173) (manual).
2. Click **Sign in with Google** and complete the consent screen.
3. You should land on the recipes home page and stay logged in across reloads.
4. Hit [http://localhost:8000/docs](http://localhost:8000/docs) — the Swagger UI should list the `/api/recipes/*` and `/api/auth/*` routes.
5. Create a recipe from the UI — it should appear in the list and persist after a container restart.

If anything fails, see [Dev tasks > Troubleshooting](dev-tasks.md#troubleshooting).
