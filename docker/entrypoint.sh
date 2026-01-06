#!/bin/bash
set -e

# Ensure media directories exist and are writable
mkdir -p /media/tmp /media/generated_icons /media/generated_thumbnails

# Select the entrypoint given the APP_SERVICE
if [[ ${APP_SERVICE} == "wsgi" ]]; then
    # Run migrations and collect static files before starting the app
    ${APP_ENV}/bin/python manage.py migrate --no-input
    ${APP_ENV}/bin/python manage.py collectstatic --no-input
    
    # Check if debug mode is enabled
    if [[ ${DJANGO_DEBUG_MODE} == "true" ]]; then
      echo "Starting Django development server with debugpy on port 5678..."
      ${APP_ENV}/bin/python -m debugpy --listen 0.0.0.0:5678 manage.py runserver 0.0.0.0:8000 --noreload --nothreading
    elif [[ ${DJANGO_ENV} == "docker" ]]; then
      ${APP_ENV}/bin/gunicorn -b 0.0.0.0:8000 --reload oregoninvasiveshotline.wsgi
    else
      ${APP_ENV}/bin/gunicorn \
        --access-logfile '-' \
        --error-logfile '-' \
        --log-file '-' \
        --access-logformat '%({x-forwarded-for}i)s %(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"' \
        --forwarded-allow-ips="${LOAD_BALANCER_IPS:-127.0.0.1}" \
        -w 4 \
        -b 0.0.0.0:8000 \
        oregoninvasiveshotline.wsgi
    fi
elif [[ ${APP_SERVICE} == "celery" ]]; then
    exec ${APP_ENV}/bin/celery -A oregoninvasiveshotline worker -l INFO
elif [[ ${APP_SERVICE} == "scheduler" ]]; then
    exec ${APP_ENV}/bin/celery -A oregoninvasiveshotline beat --pidfile=`mktemp` -l INFO
elif [[ ${APP_SERVICE} == "test" ]]; then
    exec ${APP_ENV}/bin/python manage.py test
fi
