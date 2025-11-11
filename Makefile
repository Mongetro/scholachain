# ScholaChain - Blockchain Certification Platform
# Simple deployment for both networks

.PHONY: help local sepolia stop logs status clean

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m

# Default target
help:
	@echo "$(GREEN)🌐 ScholaChain - Blockchain Certification$(NC)"
	@echo ""
	@echo "$(YELLOW)💻 LOCAL NETWORK (Recommended for testing):$(NC)"
	@echo "  $(GREEN)make local$(NC)    - Complete local setup"
	@echo ""
	@echo "$(YELLOW)🌐 SEPOLIA NETWORK (Testnet):$(NC)"
	@echo "  $(GREEN)make sepolia$(NC)  - Deploy and start with Sepolia"
	@echo ""
	@echo "$(YELLOW)⚙️  MANAGEMENT:$(NC)"
	@echo "  $(GREEN)make stop$(NC)     - Stop ALL services (both networks)"
	@echo "  $(GREEN)make logs$(NC)     - View logs"
	@echo "  $(GREEN)make status$(NC)   - Check status"
	@echo "  $(GREEN)make clean$(NC)    - Clean everything"

# ==================== LOCAL NETWORK ====================

local: stop
	@echo "$(GREEN)🚀 Starting LOCAL development environment...$(NC)"
	@echo "$(YELLOW)Building images...$(NC)"
	docker-compose build
	@echo "$(YELLOW)Starting blockchain node...$(NC)"
	docker-compose --profile local up -d hardhat-node
	@sleep 10
	@echo "$(YELLOW)Deploying contracts...$(NC)"
	docker-compose --profile local up deployer-local
	@echo "$(YELLOW)Starting application...$(NC)"
	docker-compose --profile local up -d
	@echo "$(GREEN)✅ ScholaChain is ready on LOCAL network!$(NC)"
	@echo ""
	@echo "$(BLUE)📍 Access: http://localhost:5173$(NC)"
	@echo "$(BLUE)⛓️  Blockchain: http://localhost:8545$(NC)"

# ==================== SEPOLIA NETWORK ====================

sepolia: stop
	@echo "$(GREEN)🌐 Starting SEPOLIA deployment...$(NC)"
	@if [ ! -f blockchain-smart-contracts/.env ]; then \
		echo "$(RED)❌ Missing blockchain-smart-contracts/.env file$(NC)"; \
		echo "$(YELLOW)Create it from .env.example and add your keys$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Building images...$(NC)"
	docker-compose build
	@echo "$(YELLOW)Deploying contracts to Sepolia...$(NC)"
	docker-compose --profile sepolia up deployer-sepolia
	@echo "$(YELLOW)Starting application...$(NC)"
	docker-compose --profile sepolia up -d
	@echo "$(GREEN)✅ ScholaChain is ready on SEPOLIA network!$(NC)"
	@echo ""
	@echo "$(BLUE)📍 Access: http://localhost:5173$(NC)"
	@echo "$(BLUE)🔗 Network: Sepolia Testnet$(NC)"

# ==================== MANAGEMENT ====================

stop:
	@echo "$(YELLOW)🛑 Stopping ALL services (both networks)...$(NC)"
	docker-compose --profile local down 2>/dev/null || true
	docker-compose --profile sepolia down 2>/dev/null || true
	docker-compose down 2>/dev/null || true
	@echo "$(GREEN)✅ All services stopped!$(NC)"

logs:
	@echo "$(YELLOW)📋 Service logs (Ctrl+C to exit):$(NC)"
	docker-compose logs -f

status:
	@echo "$(GREEN)📊 Service Status:$(NC)"
	docker-compose ps

clean:
	@echo "$(YELLOW)🧹 Cleaning everything...$(NC)"
	docker-compose --profile local down -v --remove-orphans 2>/dev/null || true
	docker-compose --profile sepolia down -v --remove-orphans 2>/dev/null || true
	docker-compose down -v --remove-orphans 2>/dev/null || true
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

# Default target
default: local