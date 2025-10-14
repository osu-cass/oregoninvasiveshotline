#!/bin/bash
set -e

if [[ ${APP_ENVIRONMENT} == "development" ]]; then
    echo "Starting development server"
    ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 --reload oregoninvasiveshotline.wsgi
else
    echo "Starting production server"
    ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 oregoninvasiveshotline.wsgi
fi
