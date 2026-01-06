# Zed IDE Configuration for Oregon Invasive Species Hotline

This directory contains example configuration for Zed IDE.

## Setup

1. Copy the example settings to your project's `.zed` directory:
   ```bash
   mkdir -p .zed
   cp .github/zed/settings-example.json .zed/settings.json
   ```

2. Update the `pythonPath` in `.zed/settings.json` to match your pipenv virtual environment:
   ```bash
   # Find your pipenv virtual environment path
   pipenv --venv
   
   # Update pythonPath in .zed/settings.json to: <output-from-above>/bin/python
   ```

3. The `.zed` directory is gitignored and contains user-specific settings

## Features

The configuration includes:
- Python language server (Pyright) configuration
- Ruff formatter integration
- Common Django and Docker tasks
- Environment variables for Django development

## Tasks

Access tasks via the command palette (Cmd/Ctrl+Shift+P):
- Django: Run Server
- Django: Run Migrations
- Django: Make Migrations
- Django: Run Tests
- Docker: Start All Services
- Docker: Stop All Services
- Docker: View Logs
