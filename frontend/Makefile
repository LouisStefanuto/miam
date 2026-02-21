#################################################################################
# GLOBALS                                                                       #
#################################################################################

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
install: ## Setup your project by installing frontend dependencies
	npm install

.PHONY: run
run: ## Run frontend locally
	npm run dev

.PHONY: docker
docker: ## Build Docker image and run a container
	docker build -t miam-frontend:latest .
	docker run --name my-container -p 8080:80 miam-frontend:latest
