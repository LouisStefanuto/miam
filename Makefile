#################################################################################
# Self Documenting Commands                                                     #
#################################################################################

ifeq ($(UNAME),Linux)
    ECHO := echo -e
else
	ECHO := echo
endif

# Colors
_GREY=\x1b[30m
_RED=\x1b[31m
_GREEN=\x1b[32m
_YELLOW=\x1b[33m
_BLUE=\x1b[34m
_PURPLE=\x1b[35m
_CYAN=\x1b[36m
_WHITE=\x1b[37m
_END=\x1b[0m
_BOLD=\x1b[1m
_UNDER=\x1b[4m
_REV=\x1b[7m

.PHONY: help
help: ## Show the commands and their helps
	@${ECHO} "${_BLUE}Makefile${_END}\n${_BLUE}Command\t\t\t\tDescription${_END}"
	@grep -E '^[a-zA-Z_0-9-]+:.*?[^#]## .*$$' "$(CURDIR)/Makefile" | grep -v "(NOT IMPLEMENTED)" \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "${_CYAN}%-32s${_END}%s\n", $$1, $$2}'
	@grep -E '^[a-zA-Z_0-9-]+:.*?### .*$$' "$(CURDIR)/Makefile" \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "${_WHITE}%-32s%s${_END}\n", $$1, $$2}'
	@grep -E '^[a-zA-Z_0-9-]+:.*?[^#]## .*\(NOT IMPLEMENTED\).*$$' "$(CURDIR)/Makefile" \
	| awk 'BEGIN {FS = ":.*?## "}; {printf "${_RED}%-32s${_END}%s\n", $$1, $$2}'


#################################################################################
# COMMANDS                                                                      #
#################################################################################

.PHONY: start
start: ## Start
	docker compose up --build

.PHONY: stop
stop: ## Stop
	docker compose stop
