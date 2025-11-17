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

## Getting started

Ensure that you have Docker and Docker Compose installed in your host's environment.

To use the provided Docker container definitions:

```bash
docker compose up -d --build
```

It may also be necessary to re-run the bootstrap script if it fails initially:

```bash
docker compose up -d bootstrap
```

View the website at http://localhost:8000

To authenticate with the provided default user:

    username: foobar@example.com
    password: foobar

> [!NOTE]
> This user may not appear in your database. An admin user can be created manually by submitting a report, updating it's permissions in the database, choosing the forgot password option, then grabbing the link from the console.

### API Keys

You must configure a few API keys for this project. To create them, make files with the exact names below in the `docker/secrets` folder.

- `db_password.txt`
	- Recommended: `invasives`
- `google_api_key.txt`
	- Create an API key on https://mapsplatform.google.com/. It should look something like `AIzaSyDQwAloK4wKTeKqKJ4oK4wKTeKqKJ4oK4w`.
- `secret_key.txt`
	- Create a secret key. For development, you can use whatever random string. In production, use a secure random string.

### Testing

To run the test library:
```bash
make test_container
```
    
Tests will also run automatically on pull requests.

## Deploying

This project is deployed using docker. use the `docker-compose.production.yml` file with docker compose.

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

Django ships with a set of commands that can be run from the command line. If using a Windows machine, it is reccomended to run these commands in wsl. All users should use pipenv.

For example:
```bash
pipenv shell
python3 manage.py COMMAND HERE
```

[See all commands here.](https://docs.djangoproject.com/en/5.2/ref/django-admin/)

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
