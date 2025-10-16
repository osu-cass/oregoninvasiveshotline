FROM python:3.12-slim-bookworm
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

ARG INSTALL_DEV=false
RUN ${APP_PYTHON} -m venv ${APP_ENV}
RUN if [ "$INSTALL_DEV" = "true" ]; then \
      PIPENV_CUSTOM_VENV_NAME=${APP_ENV} pipenv sync --dev; \
    else \
      PIPENV_CUSTOM_VENV_NAME=${APP_ENV} pipenv sync; \
    fi
# RUN PIPENV_CUSTOM_VENV_NAME=${APP_ENV} pipenv check
RUN ${APP_ENV}/bin/pip cache purge

# Install container entrypoint
WORKDIR /app
COPY /docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
