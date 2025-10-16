DEFAULT_GOAL := help
.PHONY = help

SHELL=/bin/bash
APP_ENV ?= ""

pipenv_python ?= python3.9
pipenv_bin = "`pipenv --venv`/bin"
ifneq ($(APP_ENV), "")
  pipenv_bin = "$(APP_ENV)/bin"
endif


help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

test:  ## Runs tests in current environment
	$(pipenv_bin)/python manage.py test --keepdb --failfast
test_container:  ## Runs tests in docker environment
	docker compose run --user=invasives --rm --env-from-file=.env.test -e APP_SERVICE=test app
shell:
	$(pipenv_bin)/python manage.py shell
run:
	$(pipenv_bin)/python manage.py runserver
celery:
	$pipenv run celery -A oregoninvasiveshotline worker -l INFO

update_pip_requirements:  ## Updates python dependencies
	@echo "Updating Python release requirements..."; echo ""
	@pipenv --venv || pipenv --python $(pipenv_python)
	@pipenv check || echo "Review the above safety issues..."
	@pipenv update --dev
	@pipenv verify || (echo "Verification failed!" && exit 1)
	@pipenv clean
	@pipenv run pip list --outdated
