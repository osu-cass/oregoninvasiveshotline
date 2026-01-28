# FRONTEND PROD
FROM node:24-bullseye-slim AS ui-build

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application source
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY frontend/ ./frontend/

# Default command to build the frontend
RUN npm run build


# FRONTEND DEV
FROM node:24-bullseye-slim AS ui-dev

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application source
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY frontend/ ./frontend/

CMD ["npm", "run", "dev"]


# PYTHON DEV/PROD
FROM python:3.12-slim-bookworm AS python
LABEL org.opencontainers.image.authors="tlinton@pdx.edu"
LABEL org.opencontainers.image.source=https://github.com/PSU-OIT-ARC/oregoninvasiveshotline

# Install project dependencies
RUN apt update -y && apt install -y \
  build-essential \
  binutils libgdal-dev proj-bin

# Set build arguments
ARG APP_PYTHON=python3
ARG APP_ENV=/opt/venv
ARG APP_REQUIREMENTS=requirements.txt
ARG INSTALL_DEV=false

ARG APP_USER=invasives
ARG APP_USER_ID=1000
ARG APP_GROUP=invasives
ARG APP_GROUP_ID=1000

# Export build arguments as environment variables
ENV APP_PYTHON=${APP_PYTHON}
ENV APP_ENV=${APP_ENV}

ENV APP_USER=${APP_USER}
ENV APP_USER_ID=${APP_USER_ID}
ENV APP_GROUP=${APP_GROUP}
ENV APP_GROUP_ID=${APP_GROUP_ID}

# Configure user
RUN groupadd -g ${APP_GROUP_ID} "${APP_GROUP}" || echo "Group already exists"
RUN useradd -d /opt -m -g "${APP_GROUP}" -u ${APP_USER_ID} "${APP_USER}" || echo "User already exists"

# Prepare application-local path
RUN chown ${APP_USER}:${APP_GROUP} /opt

# Prepare virtual environment
COPY --chown=${APP_USER}:${APP_GROUP} /Pipfile /opt/
COPY --chown=${APP_USER}:${APP_GROUP} /Pipfile.lock /opt/

RUN pip install pipenv

# Configure python virtual environment
USER ${APP_USER}
WORKDIR /opt

RUN ${APP_PYTHON} -m venv ${APP_ENV}
RUN if [ "$INSTALL_DEV" = "true" ]; then \
      PIPENV_CUSTOM_VENV_NAME=${APP_ENV} pipenv sync --dev; \
    else \
      PIPENV_CUSTOM_VENV_NAME=${APP_ENV} pipenv sync; \
    fi
# RUN PIPENV_CUSTOM_VENV_NAME=${APP_ENV} pipenv check
RUN ${APP_ENV}/bin/pip cache purge

# Copy application code
# NOTE: In development, docker-compose.yml mounts ./:/app as a volume, which
# overrides this copied code to enable live code editing.  In production, this
# copied code is used directly.
WORKDIR /app
COPY --chown=${APP_USER}:${APP_GROUP} . /app/

# Copy built frontend assets from ui-build stage
COPY --from=ui-build --chown=${APP_USER}:${APP_GROUP} /app/frontend/dist /app/frontend/dist

# Install container entrypoint
COPY /docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
