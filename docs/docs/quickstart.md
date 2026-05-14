# Quick start

!!! success "Get Miam running locally in about 10 minutes"
    By the end you will have the full stack — Postgres, FastAPI backend, React frontend — up on your machine and you will be able to create your first recipe, **on a local instance of Miam**.

    This tutorial is opinionated and linear. For alternative paths (running Vite directly, deploying to a server, day-to-day commands), see the [How-to guides](how-to/local.md).

## Prerequisites

| Tool | Install |
| --- | --- |
| Git | [git-scm.com](https://git-scm.com/downloads) |
| Docker + Docker Compose | [docker.com/get-started](https://www.docker.com/get-started/) |
| `make` | Pre-installed on macOS and Linux |

Quick check:

```bash
git --version && docker --version && docker compose version
```

You will also need a Google account — Miam delegates sign-in to Google OAuth.

## 1. Clone the repository

```bash
git clone https://github.com/LouisStefanuto/miam.git
cd miam
```

## 2. Create a Google OAuth client

Miam will not start a session without a Google Client ID.

1. Open the [Google Cloud Console](https://console.cloud.google.com) and create (or pick) a project.
2. Go to **Google Auth Platform > Clients**, click **Create Client**, choose **Web application**.
3. Under **Authorized JavaScript origins**, add `http://localhost:3000`.
4. Copy the generated **Client ID**.
5. Under **Audience > Test users**, add your Google email.

For the full reasoning and how the token flow works, see [Authentication](concepts/auth.md).

## 3. Configure the environment

Copy the example env files and paste in your Client ID:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

In `backend/.env`:

```env
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

In `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
```

The other defaults are fine for local development.

## 4. Start the stack

```bash
make start
```

That builds and launches three containers: `db` (Postgres 16), `backend` (FastAPI on `:8000`), and `frontend` (nginx serving the built React app on `:3000`). The first build takes a few minutes; subsequent boots are seconds.

Database migrations run automatically inside the backend container — you do not need to invoke Alembic yourself.

## 5. Sign in and create a recipe

1. Open [http://localhost:3000](http://localhost:3000).
2. Click **Sign in with Google** and complete the consent screen.
3. You should land on the recipes home page.
4. Create your first recipe from the UI — it should appear in the list and persist after a restart.

You can also explore the auto-generated API at [http://localhost:8000/docs](http://localhost:8000/docs).

## 6. Stop the stack

```bash
make stop
```

To wipe containers **and the database volume** for a clean slate:

```bash
make clean
```

## Next steps

Congrats — Miam is up and running on your machine. Pick a path to go deeper:

- Need different config (CORS, JWT secret, Vite dev server)? → [Configure the environment](how-to/environment.md)
- Running tests, linting, dumping the DB? → [Dev tasks](how-to/dev-tasks.md)
- Deploying to a server? → [Production deployment](how-to/production.md)
- Want to understand the stack? → [Architecture](concepts/architecture.md)
