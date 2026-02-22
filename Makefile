#################################################################################
# GLOBALS                                                                       #
#################################################################################

PYTHON_VERSION = 3.13

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
BLUE   := \033[0;34m
RESET  := \033[0m

#################################################################################
# HELP                                                                          #
#################################################################################

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Available commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; \
		{printf "  $(GREEN)%-22s$(RESET) %s\n", $$1, $$2}'

#################################################################################
# COMMANDS                                                                      #
#################################################################################

.PHONY: install
install: ## Setup your project by installing dependencies and venv
	cd backend
	uv sync --all-extras
	cd ..

.PHONY: start
start: ## Start all containers
	docker compose up --build

.PHONY: stop
stop: ## Stop all containers
	docker compose stop

.PHONY: pre-commit
pre-commit: ## Run pre-commit
	uv --directory backend run pre-commit run --all-files

.PHONY: clean
clean: ## Kill all containers and remove pgdata volume
	docker compose down -v
	rm -rf ./backend/images

.PHONY: docs
docs: ## Serve documentation locally
	uv --directory docs run mkdocs serve -a 0.0.0.0:8001
