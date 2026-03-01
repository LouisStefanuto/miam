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

.PHONY: create-environment
create-environment: ## Set up Python environment using uv
	uv venv --python $(PYTHON_VERSION)
	uv sync --all-extras

.PHONY: lint
lint: ## Lint using ruff (use `make format` to do formatting)
	ruff check --fix
	ruff format

.PHONY: test
test: ## Run unit tests
	python -m pytest tests

.PHONY: clean
clean: ## Delete all compiled Python files
	find . -type f -name "*.py[co]" -delete
	find . -type d -name "__pycache__" -delete

.PHONY: docker
docker: ## Build Docker image and run a container
	docker build -t miam-backend:latest .
	docker run --name my-container -p 8000:8000 miam-backend:latest

.PHONY: sql
sql: ## Test connexion to the sql server
	uv run scripts/test_connexion_db.py

.PHONY: api
api: ## Run the API server
	uv run uvicorn miam.api.main:app --host 0.0.0.0 --port 8000 --reload
