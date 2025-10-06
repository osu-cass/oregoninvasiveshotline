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
	docker compose run --user=invasives --rm -e EMCEE_CMD_ENV=docker -e EMCEE_APP_CONFIG=app.test.yml -e APP_SERVICE=test app
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

install_javascript: sentry_version=""
install_javascript:  ## Handles installation of compiled javascript modules from `node_modules`
	@echo "Installing js-cookie..."
	@cp node_modules/js-cookie/dist/js.cookie.min.js oregoninvasiveshotline/static/js/
	@echo "Installing jquery..."
	@cp node_modules/jquery/dist/*.min.* oregoninvasiveshotline/static/js/
	@echo "Installing jquery-migrate..."
	@cp node_modules/jquery-migrate/dist/*.min.* oregoninvasiveshotline/static/js/
	@echo "Installing bootstrap..."
	@cp node_modules/bootstrap/dist/js/*.min.js* oregoninvasiveshotline/static/js/
	@cp node_modules/bootstrap/dist/css/*.min.css* oregoninvasiveshotline/static/css/
	@cp node_modules/bootstrap/dist/fonts/* oregoninvasiveshotline/static/fonts/
	@echo "Installing select2..."
	@cp node_modules/select2/dist/js/select2.min.js oregoninvasiveshotline/static/js/
	@cp node_modules/select2/dist/css/select2.min.css oregoninvasiveshotline/static/css/
	@cp node_modules/select2-bootstrap-theme/dist/select2-bootstrap.css oregoninvasiveshotline/static/css/
	@echo "Installing galleria..."
	@cp node_modules/galleria/dist/galleria.min.js* oregoninvasiveshotline/static/js/
	@cp node_modules/galleria/dist/themes/classic/galleria.classic.css oregoninvasiveshotline/static/css/
	@cp node_modules/galleria/dist/themes/classic/galleria.classic.min.js oregoninvasiveshotline/static/js/
	@sed -i "s|galleria.classic.css|../css/galleria.classic.css|" oregoninvasiveshotline/static/js/galleria.classic.min.js

	@echo "Installing sentry/browser + sentry/tracing..."
	curl -XGET https://browser.sentry-cdn.com/$(sentry_version)/bundle.tracing.es5.min.js -o oregoninvasiveshotline/static/js/sentry.browser.min.js
	curl -XGET https://browser.sentry-cdn.com/$(sentry_version)/bundle.tracing.es5.min.js.map -o oregoninvasiveshotline/static/js/sentry.browser.min.js.map

client_dependencies:  ## Builds npm dependencies and copies built ('dist') artifacts into static collection directory.
	@yarn install
	@yarn upgrade
	@make install_javascript sentry_version="$$(grep -n1 "@sentry/tracing" yarn.lock  | grep version | cut -d" " -f4 | grep -Po '(?<=")[\d\.]+')"
	@yarn outdated || echo "Outstanding updates..."

bump_versions:  ## Updates version of project images
	@$(pipenv_bin)/python bump_versions.py

release: bump_versions  ## Performs bookkeeping necessary for a new release
	@echo "Created new release"
