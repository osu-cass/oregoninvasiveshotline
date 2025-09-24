#!/bin/bash
set -e

if [[ ${APP_SERVICE} == "bootstrap" ]]; then
    ${APP_ENV}/bin/python manage.py migrate --no-input
    ${APP_ENV}/bin/python manage.py collectstatic --no-input
    exit 0
fi

# Select the entrypoint given the APP_SERVICE
if [[ ${APP_SERVICE} == "wsgi" ]]; then
    if [[ ${EMCEE_CMD_ENV} == "docker" ]]; then
        if [[ ${APP_ENVIRONMENT} == "development" ]]; then
            ${APP_ENV}/bin/pip install -r /app/docker/requirements-prod.txt
            ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 --reload oregoninvasiveshotline.wsgi
        else
            ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 oregoninvasiveshotline.wsgi
    else
        ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 oregoninvasiveshotline.wsgi
        # exec ${APP_ENV}/bin/uwsgi --include /uwsgi/uwsgi.ini
    fi
elif [[ ${APP_SERVICE} == "celery" ]]; then
    exec ${APP_ENV}/bin/celery -A oregoninvasiveshotline worker -l INFO
elif [[ ${APP_SERVICE} == "scheduler" ]]; then
    exec ${APP_ENV}/bin/celery -A oregoninvasiveshotline beat --pidfile=`mktemp` -l INFO
elif [[ ${APP_SERVICE} == "test" ]]; then
    ${APP_ENV}/bin/pip install -r /app/docker/requirements-test.txt
    exec ${APP_ENV}/bin/python manage.py test
fi
