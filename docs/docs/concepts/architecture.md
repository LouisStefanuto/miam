# Architecture

![high-level](../assets/images/high-level.png)

| Layer | Stack |
| --- | --- |
| **User** | Web browser · Google OAuth 2.0 · HttpOnly cookie session · HTTPS |
| **Frontend** | React 18 · Vite · TypeScript · Tailwind · shadcn/ui · React Router · served by nginx |
| **Backend** | FastAPI · Python 3.13 (uv) · SQLAlchemy 2 · Pydantic v2 · Hexagonal (ports/adapters) · Markdown & Word exporters |
| **Database** | PostgreSQL 16 · Alembic migrations · psycopg / asyncpg · Docker named volume |
| **Ops** | Docker Compose · Dozzle (container monitoring) · Locust (load testing) |
