#!/bin/bash
set -e

if [[ ${APP_ENVIRONMENT} == "development" ]]; then
    ${APP_ENV}/bin/pip install -r /app/docker/requirements-dev.txt
    ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 --reload oregoninvasiveshotline.wsgi
else
    ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 oregoninvasiveshotline.wsgi
fi