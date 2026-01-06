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
	- Create an API key on https://mapsplatform.google.com/. It should look something like `AIzaSyDQwAloK4wKTeKqKJ4oK4wKTeKqKJ4oK4w`.
- `secret_key.txt`
	- Create a secret key. For development, you can use whatever random string. In production, use a secure random string.

### Starting Docker

To use the provided Docker container definitions:

```bash
docker compose up
```

View the website at http://localhost:8000.

### Testing

To run the test library:
```bash
make test_container
```
    
Tests will also run automatically on pull requests.

To access the mail server, navigate to http://localhost:8025.

The docker compose also comes with pgAdmin, but it's disabled by default as many developers already have a postgres admin tool installed.
To run pgAdmin, use the following command:
```bash
# Launch just pgAdmin
docker-compose --profile dev-tools up pgadmin

# Launch all containers and pgAdmin
docker-compose --profile dev-tools up
```

Then, it's accessible via http://localhost:5050.

### Debugging

This project includes debugging configurations for both Visual Studio Code and Zed IDE.

#### Prerequisites

Before debugging, ensure you have:
1. Installed debugpy in the development environment (already included in `Pipfile` dev dependencies)
2. Set up your IDE with the appropriate extensions/language servers

#### Debugging with Visual Studio Code

The repository includes a `.vscode/launch.json` configuration with three debugging options:

1. **Django: Attach to Docker** - Attach to the running Django application in Docker
2. **Django: Debug Manage.py** - Debug Django management commands locally
3. **Django: Debug Tests** - Debug Django tests locally

**To debug the Django application in Docker:**

1. Start the application in debug mode:
   ```bash
   docker compose -f docker-compose.debug.yml up
   ```

2. In VS Code, open the Run and Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
3. Select "Django: Attach to Docker" from the configuration dropdown
4. Press F5 or click the green play button to attach the debugger
5. Set breakpoints in your Python code by clicking in the gutter next to line numbers
6. The debugger will pause execution when it hits your breakpoints

**To debug locally (without Docker):**

1. Set up a local Python virtual environment:
   ```bash
   pipenv install --dev
   pipenv shell
   ```

2. Configure your local database settings in a `.env` file
3. Use the "Django: Debug Manage.py" or "Django: Debug Tests" configurations
4. Press F5 to start debugging

**Recommended VS Code Extensions:**
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- Python Debugger (ms-python.debugpy)
- Ruff (charliermarsh.ruff)
- Django (batisteo.vscode-django)

#### Debugging with Zed IDE

The repository includes a `.zed/settings.json` configuration with tasks for common Django operations.

1. Open the project in Zed IDE
2. The Python language server (Pyright) will automatically use the configuration
3. Use the command palette to access tasks:
   - "Django: Run Server"
   - "Django: Run Migrations"
   - "Django: Run Tests"
   - "Docker: Start All Services"
   - "Docker: View Logs"

For debugging in Zed, you can:
1. Use the integrated terminal to start the debug server:
   ```bash
   docker compose -f docker-compose.debug.yml up
   ```

2. In a separate terminal, you can attach to the debugger or use print statements for debugging
3. Zed's language server will provide inline type checking and code intelligence

#### Debugging Tips

- The debug server runs on port 5678 (exposed from the Docker container)
- The Django development server runs on port 8000
- When debugging in Docker, source code changes are reflected immediately due to volume mounts
- Use `--noreload` and `--nothreading` flags with debugpy to prevent issues with breakpoints
- Check Docker logs if the debugger won't attach: `docker compose logs -f app`

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

# Service Architecture

## In development

<details>
<summary>
Expand this dropdown to see the service architecture when working in development.
</summary>
<img src="./readme-media/service-architecture-development.png" />
</details>

## In production

<details>
<summary>
Expand this dropdown to see the service architecture when working in production.
</summary>
<img src="./readme-media/service-architecture-production.png" />
</details>