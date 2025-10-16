#!/bin/bash
set -e

# Ensure media directories exist and are writable
mkdir -p /media/tmp /media/generated_icons /media/generated_thumbnails

# Select the entrypoint given the APP_SERVICE
if [[ ${APP_SERVICE} == "wsgi" ]]; then
    # Run migrations and collect static files before starting the app
    ${APP_ENV}/bin/python manage.py migrate --no-input
    ${APP_ENV}/bin/python manage.py collectstatic --no-input

    if [[ ${DJANGO_ENV} == "docker" ]]; then
        ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 --reload oregoninvasiveshotline.wsgi
    else
        exec ${APP_ENV}/bin/uwsgi --include /uwsgi/uwsgi.ini
    fi
elif [[ ${APP_SERVICE} == "celery" ]]; then
    exec ${APP_ENV}/bin/celery -A oregoninvasiveshotline worker -l INFO
elif [[ ${APP_SERVICE} == "scheduler" ]]; then
    exec ${APP_ENV}/bin/celery -A oregoninvasiveshotline beat --pidfile=`mktemp` -l INFO
elif [[ ${APP_SERVICE} == "test" ]]; then
    exec ${APP_ENV}/bin/python manage.py test
fi
