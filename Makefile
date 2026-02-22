.PHONY: help dev dev-services stop install clean build lint format check test

# Colors
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m

help: ## Affiche l'aide
	@echo "$(CYAN)Patissio - Commandes disponibles$(NC)"
	@echo "========================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

info: ## Affiche les URLs de tous les services
	@echo ""
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)Patissio - Services & URLs$(NC)"
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""
	@echo "$(YELLOW)Applications:$(NC)"
	@echo "  API:            http://localhost:3333"
	@echo "  Web App:        http://localhost:3000"
	@echo "  Superadmin:     http://localhost:3002"
	@echo "  Stripe Webhooks: stripe listen → localhost:3333/webhooks/stripe"
	@echo ""
	@echo "$(YELLOW)Services de developpement:$(NC)"
	@echo "  PostgreSQL:     localhost:5432"
	@echo "  Adminer:        http://localhost:5050"
	@echo "  Maildev:        http://localhost:1080"
	@echo "  Redis:          localhost:6379"
	@echo "  MinIO Console:  http://localhost:9001"
	@echo "  MinIO API:      http://localhost:9000"
	@echo ""
	@echo "$(YELLOW)Credentials:$(NC)"
	@echo "  $(GREEN)MinIO:$(NC)"
	@echo "    User:     minioadmin"
	@echo "    Password: minioadmin"
	@echo "  $(GREEN)PostgreSQL:$(NC)"
	@echo "    User:     postgres"
	@echo "    Password: postgres"
	@echo "    Database: patisserie"
	@echo ""
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo "$(GREEN)Tip: Utilisez 'make help' pour voir toutes les commandes$(NC)"
	@echo "$(CYAN)━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━$(NC)"
	@echo ""

install: ## Installe les dependances
	@echo "$(CYAN)Installation des dependances...$(NC)"
	pnpm install
	@echo "$(GREEN)Installation terminee$(NC)"

setup: install ## Setup initial (install + env + key)
	@echo "$(CYAN)Configuration initiale...$(NC)"
	@if [ ! -f apps/api/.env ]; then \
		cp apps/api/.env.example apps/api/.env; \
		echo "$(GREEN)apps/api/.env cree$(NC)"; \
	fi
	@if [ ! -f apps/web/.env.local ]; then \
		cp apps/web/.env.example apps/web/.env.local; \
		echo "$(GREEN)apps/web/.env.local cree$(NC)"; \
	fi
	@if [ ! -f apps/superadmin/.env.local ]; then \
		cp apps/superadmin/.env.example apps/superadmin/.env.local; \
		echo "$(GREEN)apps/superadmin/.env.local cree$(NC)"; \
	fi
	@echo "$(YELLOW)N'oubliez pas de generer une APP_KEY:$(NC)"
	@echo "   cd apps/api && node ace generate:key"
	@echo "$(GREEN)Setup termine$(NC)"

dev-services: ## Demarre uniquement les services Docker (PostgreSQL, Redis, etc.)
	@echo "$(CYAN)Demarrage des services Docker...$(NC)"
	docker compose up -d
	@echo "$(YELLOW)Attente que les services soient prets...$(NC)"
	@sleep 5
	@echo "$(GREEN)Services Docker demarres$(NC)"
	@echo ""
	@echo "$(CYAN)Utilisez 'make info' pour voir toutes les URLs et credentials$(NC)"

dev: dev-services ## Demarre l'environnement complet (Docker + Apps + Stripe)
	@echo ""
	@echo "$(CYAN)Demarrage des applications...$(NC)"
	@echo "$(YELLOW)Appuyez sur Ctrl+C pour arreter$(NC)"
	@echo ""
	stripe listen --load-from-webhooks-api --forward-to localhost:3333/webhooks/stripe --latest & pnpm dev

dev-api: dev-services ## Demarre uniquement l'API
	@echo "$(CYAN)Demarrage de l'API...$(NC)"
	pnpm --filter=api dev

dev-web: ## Demarre uniquement l'app web (sans Docker)
	@echo "$(CYAN)Demarrage de l'app web...$(NC)"
	pnpm --filter=web dev

dev-superadmin: ## Demarre uniquement le superadmin (sans Docker)
	@echo "$(CYAN)Demarrage du superadmin...$(NC)"
	pnpm --filter=@patissio/superadmin dev

stop: ## Arrete tous les services Docker
	@echo "$(YELLOW)Arret des services Docker...$(NC)"
	docker compose down
	@echo "$(GREEN)Services arretes$(NC)"

clean: stop ## Nettoie les caches et arrete les services
	@echo "$(CYAN)Nettoyage des caches...$(NC)"
	rm -rf .turbo
	rm -rf apps/*/node_modules/.cache
	rm -rf apps/*/.next
	rm -rf apps/*/dist
	rm -rf apps/*/build
	rm -rf packages/*/dist
	@echo "$(GREEN)Nettoyage termine$(NC)"

build: ## Build toutes les applications
	@echo "$(CYAN)Build des applications...$(NC)"
	pnpm build
	@echo "$(GREEN)Build termine$(NC)"

build-api: ## Build uniquement l'API
	@echo "$(CYAN)Build de l'API...$(NC)"
	pnpm --filter=api build
	@echo "$(GREEN)Build API termine$(NC)"

build-web: ## Build uniquement l'app web
	@echo "$(CYAN)Build de l'app web...$(NC)"
	pnpm --filter=web build
	@echo "$(GREEN)Build web termine$(NC)"

build-superadmin: ## Build uniquement le superadmin
	@echo "$(CYAN)Build du superadmin...$(NC)"
	pnpm --filter=@patissio/superadmin build
	@echo "$(GREEN)Build superadmin termine$(NC)"

lint: ## Execute le linter (Biome)
	@echo "$(CYAN)Execution du linter...$(NC)"
	pnpm check

lint-fix: ## Corrige automatiquement les erreurs de lint
	@echo "$(CYAN)Correction automatique du lint...$(NC)"
	pnpm format
	@echo "$(GREEN)Lint corrige$(NC)"

format: lint-fix ## Alias pour lint-fix

check: ## Verifie les types TypeScript
	@echo "$(CYAN)Verification des types...$(NC)"
	pnpm check-types

test: ## Execute les tests
	@echo "$(CYAN)Execution des tests...$(NC)"
	pnpm test

test-api: ## Execute les tests de l'API
	@echo "$(CYAN)Execution des tests API...$(NC)"
	pnpm --filter=api test

# Database commands
db-migrate: ## Execute les migrations
	@echo "$(CYAN)Execution des migrations...$(NC)"
	cd apps/api && node ace migration:run
	@echo "$(GREEN)Migrations terminees$(NC)"

db-rollback: ## Rollback la derniere migration
	@echo "$(YELLOW)Rollback de la derniere migration...$(NC)"
	cd apps/api && node ace migration:rollback
	@echo "$(GREEN)Rollback termine$(NC)"

db-fresh: ## Drop tout et re-migre (DANGER)
	@echo "$(RED)ATTENTION: Suppression de TOUTES les donnees!$(NC)"
	@echo "$(YELLOW)   Appuyez sur Ctrl+C pour annuler (5 secondes)...$(NC)"
	@sleep 5
	cd apps/api && node ace migration:fresh
	@echo "$(GREEN)Base de donnees fraiche creee$(NC)"

db-seed: ## Seed la base de donnees
	@echo "$(CYAN)Seed de la base de donnees...$(NC)"
	cd apps/api && node ace db:seed
	@echo "$(GREEN)Seed termine$(NC)"

db-reset: db-fresh db-seed ## Reset complet (fresh + seed)

db-status: ## Affiche le statut des migrations
	@echo "$(CYAN)Statut des migrations:$(NC)"
	cd apps/api && node ace migration:status

# Utility commands
logs: ## Affiche les logs des services Docker
	docker compose logs -f

ps: ## Affiche l'etat des services Docker
	docker compose ps

restart: stop dev ## Redemarre tout

generate-key: ## Genere une APP_KEY pour AdonisJS
	@echo "$(CYAN)Generation de l'APP_KEY...$(NC)"
	cd apps/api && node ace generate:key
	@echo "$(GREEN)APP_KEY generee$(NC)"
