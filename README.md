# Oregon Invasive Species Hotline

This project allows members of the public to submit reports of invasive species for experts to
review. Experts can login and review the reports, comment on them, and make a final determination
about the species that was reported.

## Technology stack

- PostgreSQL 16
- PostGIS 3.5.x
- Python 3.12
- Django 5.2 LTS
- Google Maps
- Bootstrap 5

Packages are managed with a jsDelivr script link in `templates/base.html`.

## Getting started

Ensure that you have Docker and Docker Compose installed in your host's environment.

### Setting up Secrets

You must configure a few API keys for this project. To create them, make files with the exact names below in the `docker/secrets` folder.

- `db_password.txt`
  - Recommended: `invasives`
- `google_api_key.txt`
  - Create an API key on <https://mapsplatform.google.com/>. It should look something like `AIzaSyDQwAloK4wKTeKqKJ4oK4wKTeKqKJ4oK4w`.
- `secret_key.txt`
  - Create a secret key. For development, you can use whatever random string. In production, use a secure random string.

### Creating the `.env` File

Copy the `.env-default` to a new file called `.env`.

```sh
cp .env-default .env
```

### Starting Docker

To use the provided Docker container definitions:

```bash
docker compose up --watch
```

View the website at <http://localhost:8000>.

### Testing

To run the test library:

```bash
make test_container
```

Tests will also run automatically on pull requests.

To access the mail server, navigate to <http://localhost:8025>.

The docker compose also comes with pgAdmin, but it's disabled by default as many developers already have a postgres admin tool installed.
To run pgAdmin, use the following command:

```bash
# Launch just pgAdmin
docker compose --profile dev-tools up pgadmin

# Launch all containers and pgAdmin
docker compose --profile dev-tools up
```

Then, it's accessible via <http://localhost:5050>.

### Running Debug Mode

Go to the "Run and Debug" view in VS Code. Select the "Django: Launch & Debug" configuration, and then click the green play button.

By default, the debugger is running on port 1080. However, you can change this port by setting the `DEBUG_PORT` environment variable.

## Deploying

This project is deployed using docker. Use the `docker-compose.deploy.yml` file with docker compose.

Containers are built using GitHub Actions.

## General notes

### Regular maintenance tasks

This project ships with a celerybeat configuration which handles scheduling of several regular tasks:

- Clearing expired HTTP sessions
- Generates icons for uploaded images

### Email notifications

Several workflows trigger email notifications based on specific criteria. All such notifications
are implemented and orchestrated using Celery-based tasks in order that they are performed
out-of-band with respect to the request/response cycle.

### Running django commands

Django ships with a set of commands that can be run from the command line. If using a Windows machine, it is recommended to run these commands in wsl. All users should use pipenv.

For example:

```bash
pipenv shell
python3 manage.py COMMAND HERE
```

[See all commands here.](https://docs.djangoproject.com/en/5.2/ref/django-admin/)

### Static Code Analysis

This project uses `ruff` and `pyright` for static code analysis. These commands must be run from within a WSL (Windows Subsystem for Linux) environment after activating the project's virtual environment:

```bash
pipenv shell
```

To run `ruff`:

```bash
ruff check .
```

To run `pyright`:

```bash
pyright
```

### Creating a Superuser

To create a superuser, run the following command:

```bash
python manage.py createsuperuser
```

Alternatively, you can open create a category in the database, submit a report, set the new user's is_active and is_staff attributes to true, and then run a password reset.

### Application behavior

This project uses an unconventional approach to its use of the built-in Django user and
authentication mechanisms. Traditionally, the `User.is_active` attribute supports soft-delete
behavior, whereby individual users may be disabled without removing the record and those with
relations to it. In this case, the attribute signifies whether or not the user record in question
is considered to be staff or an individual (unaffiliated) contributor.

In order to support the pre-existing workflows which require these users to be able to login
(i.e., successfully authenticate), the `django.contrib.auth.backends.AllowAllUsersModelBacked`
added in Django 1.10 is used.

There is a "subscribe to search" feature that allows an active user of the system to perform
a search on the reports list page and then subscribe to it. Meaning: whenever a new report is
submitted that matches that search, the subscriber will get an email notification about it.
The way this is implemented is the `request.GET` parameters are saved to the `UserNotificationQuery`
model as a string like "querystring=foobar&category-4=142".

When a report is submitted, a new `ReportSearchForm` is instantiated and passed the decoded GET
parameters that were saved in the `UserNotificationQuery` model; if the `search` method on the
form finds results matching the newly submitted report a notification is sent to the user.

## Service Architecture

### In development

<details>
<summary>
Expand this dropdown to see the service architecture when working in development.
</summary>
<img src="./readme-media/service-architecture-development.png" alt="Containerized application architecture running in Docker. At the top left is a PostGIS container (PostgreSQL with geospatial support), exposing port 5439 mapped to 5432. It stores database data and archives on mounted volumes. Below PostGIS is a pgAdmin container (port 5050 mapped to 80) used for PostgreSQL administration; it depends on PostGIS being healthy. At the top right is a RabbitMQ container (internal port 5672) acting as the message broker. Below RabbitMQ is a Celery worker container, which depends on RabbitMQ being healthy and mounts application code and media volumes. At the center bottom is the main App container (port 8000 mapped to 8000). The App depends on both the database being healthy and the Celery service being started. It mounts application code, static files, media files, and system timezone configuration. Below the App is a Mailpit container. Mailpit exposes a web UI on port 8025 and an SMTP service on port 1025. It depends on the App being healthy and is used for capturing and viewing outgoing emails during development or testing. Overall flow: PostGIS provides persistent data storage; RabbitMQ queues background jobs; Celery processes those jobs asynchronously; the App serves the web application and coordinates with the database and background workers; pgAdmin provides database management; Mailpit captures application emails. All services run as Docker containers with explicit health-based startup ordering."/>
</details>

### In production

<details>
<summary>
Expand this dropdown to see the service architecture when working in production.
</summary>
<img src="./readme-media/service-architecture-production.png" alt="Runtime architecture for the deployed application showing Docker containers and required external services. On the left are three external services not running in Docker: an external PostgreSQL database that must include PostGIS functionality and serves as the application’s primary data store; Sentry, an external error monitoring service configured via environment variables such as SENTRY_DSN and SENTRY_ENVIRONMENT; and an external SMTP server that accepts outgoing email from the application and is configured using environment variables including email host, port, TLS usage, username, and password. On the right are Docker-managed services: a RabbitMQ container on internal port 5672 acting as the message broker for asynchronous tasks and persisting data on a mounted volume; a Celery worker container that depends on RabbitMQ being healthy and processes background jobs, mounting application code, media storage, and system timezone configuration; and the main App container exposing a web server on port 8000 or a configurable port via the APP_PORT environment variable, mounting application code, static files, media files, and system timezone configuration. The App depends on the availability of PostgreSQL, the SMTP server, Sentry, and the Celery and RabbitMQ background processing pipeline. If the App container fails its health check, traffic is routed to Maintenance Mode, where a static HTML page is displayed instead of the application to indicate the service is unavailable."/>
</details>
