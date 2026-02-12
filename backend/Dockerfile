########################################################################################
# Docker file taken from:                                                              #
# https://github.com/astral-sh/uv-docker-example/tree/main?tab=readme-ov-file          #
# Commit: c16a61f                                                                      #
#                                                                                      #
# This repo contains multiple Docker files, of increasing complexity.                  #
# An example using multi-stage image builds to create a final image without uv.        #
########################################################################################

ARG UV_IMAGE_TAG=0.6.13-python3.13-bookworm-slim
ARG PYTHON_VERSION=3.13.2

# First, build the application in the `/app` directory.
# See `Dockerfile` for details.
FROM ghcr.io/astral-sh/uv:${UV_IMAGE_TAG} AS builder
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

# Disable Python downloads, because we want to use the system interpreter
# across both images. If using a managed Python version, it needs to be
# copied from the build image into the final image; see `standalone.Dockerfile`
# for an example.
ENV UV_PYTHON_DOWNLOADS=0

WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-dev

COPY pyproject.toml uv.lock README.md ./
COPY src/ src/
COPY alembic/ alembic/
COPY alembic.ini ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev


# Then, use a final image without uv
FROM python:${PYTHON_VERSION}-slim-bookworm
# It is important to use the image that matches the builder, as the path to the
# Python executable must be the same, e.g., using `python:3.11-slim-bookworm`
# will fail.

# Copy the application from the builder
COPY --from=builder --chown=app:app /app /app

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"
WORKDIR /app

# Run the FastAPI application by default
# Uses `fastapi dev` to enable hot-reloading when the `watch` sync occurs
# Uses `--host 0.0.0.0` to allow access from outside the container
# CMD ["fastapi", "dev", "--host", "0.0.0.0", "src/miam/api/main.py"]
CMD ["sh", "-c", "alembic upgrade head && fastapi dev --host 0.0.0.0 src/miam/api/main.py"]
