# Environment

Both services read configuration from a `.env` file. Each has a committed `.env.example` you can copy from:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

## `backend/.env`

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credentials used by the Postgres container at first boot |
| `DATABASE_URL` | SQLAlchemy connection string. Use `@db:5432` when Postgres runs in Docker Compose; point to your managed DB host otherwise |
| `JWT_SECRET_KEY` | HMAC secret used to sign app JWTs. **Generate a random string** for anything beyond local development |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID — see [Google Sign-In](#google-sign-in) below |
| `CORS_ORIGINS` *(optional)* | Comma-free Python-list-style list of allowed origins. Defaults to `["http://localhost", "http://localhost:3000"]`. **Must be overridden** for non-local deployments |

Generate a strong JWT secret:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## `frontend/.env`

| Variable | Purpose |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Same Google client ID as the backend — must match exactly |
| `VITE_API_BASE_URL` *(optional)* | Defaults to `/api` (the frontend's nginx proxies `/api` to the backend service). Override only when serving the frontend and backend on **different origins** |

!!! note "Runtime vs build-time config"

    The frontend image generates `window.__RUNTIME_CONFIG__` at container startup (see `frontend/docker-entrypoint.sh`). That means a single pre-built image can be re-used across environments — you only need to pass the right `VITE_GOOGLE_CLIENT_ID` at `docker run` / `docker compose up` time, not at build time.

## Google Sign-In

Authentication is delegated to Google (see [Authentication](../concepts/auth.md) for the full flow). You need an OAuth Client ID before the app will let you log in.

1. Open the [Google Cloud Console](https://console.cloud.google.com) and create (or pick) a project.
2. Go to **Google Auth Platform > Clients**, click **Create Client**, and choose **Web application**.
3. Under **Authorized JavaScript origins**, add **every** URL the frontend will be served from:

    | Environment | Origins to add |
    | --- | --- |
    | Local Docker | `http://localhost:3000` |
    | Local manual (Vite dev server) | `http://localhost:5173` |
    | Staging | `https://staging.your-domain.com` |
    | Production | `https://your-domain.com` |

    !!! warning "HTTPS in non-local deployments"

        Google refuses non-`localhost` origins served over plain HTTP. Any deployed environment **must** use HTTPS — the app's JWT cookie is also marked `secure=True`, so it will not be sent over an unencrypted connection either way.

4. Copy the generated **Client ID** and paste it into both env files:

    ```env
    # backend/.env
    GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

    # frontend/.env
    VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
    ```

5. While the app is in **Testing** mode in Google Auth Platform, add each user's email under **Audience > Test users** — otherwise Google will refuse to issue a token. Once you publish the app, this restriction lifts.

Next:

- [Run locally](local.md) on your machine, or
- [Deploy to a remote server](production.md).
