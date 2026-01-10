#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    if [[ "${YES:-0}" != "1" ]]; then
        log_warn "Running as root is not recommended. Continue? (y/N)"
        read -r confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_warn "Running as root (auto-confirmed via YES=1)."
    fi
fi

# Detect OS
OS="$(uname -s)"
case "$OS" in
    Linux)     OS=linux ;;
    Darwin)    OS=darwin ;;
    *)         log_error "Unsupported OS: $OS"; exit 1 ;;
esac

# Detect package manager
if command -v npm &> /dev/null; then
    PM="npm"
elif command -v yarn &> /dev/null; then
    PM="yarn"
else
    log_error "Neither npm nor yarn found. Please install Node.js >=18."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d 'v' -f2)
MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d '.' -f1)
if [[ "$MAJOR_VERSION" -lt 18 ]]; then
    log_error "Node.js version must be >=18. Found $NODE_VERSION."
    exit 1
fi

log_info "Detected OS: $OS, Package manager: $PM, Node version: $NODE_VERSION"

# Function to run command with error handling
run_cmd() {
    log_info "Running: $*"
    if ! "$@"; then
        log_error "Command failed: $*"
        exit 1
    fi
}

# 1. Fix dependency issues
fix_dependencies() {
    log_info "Fixing dependency issues (ajv, schema-utils, webpack)..."
    cd "$PROJECT_ROOT"
    # Check if ajv is installed globally (should be in node_modules)
    if [[ -f "package-lock.json" ]]; then
        # Use npm to install specific versions
        run_cmd npm install ajv@^8.0.0 ajv-keywords@^5.0.0 schema-utils@^4.0.0 --no-save
    fi
    # Ensure client/webpack uses correct versions
    if [[ -d "client" ]]; then
        cd client
        run_cmd npm install ajv@^8.0.0 ajv-keywords@^5.0.0 schema-utils@^4.0.0 --no-save
        cd ..
    fi
    log_info "Dependency fixes applied."
}

# 2. Set up PostgreSQL database
setup_postgres() {
    log_info "Setting up PostgreSQL database..."
    if ! command -v psql &> /dev/null; then
        log_warn "PostgreSQL not found. Installing via apt (Linux only)..."
        if [[ "$OS" == "linux" ]]; then
            run_cmd sudo apt-get update
            run_cmd sudo apt-get install -y postgresql postgresql-contrib
        else
            log_error "Please install PostgreSQL manually. See https://www.postgresql.org/download/"
            return 1
        fi
    fi

    # Start PostgreSQL service
    if [[ "$OS" == "linux" ]]; then
        run_cmd sudo systemctl start postgresql || true
        run_cmd sudo systemctl enable postgresql || true
    fi

    # Create database and user
    log_info "Creating database 'phaser_platformer' and user 'postgres'..."
    sudo -u postgres psql -c "CREATE DATABASE phaser_platformer;" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE phaser_platformer TO postgres;" 2>/dev/null || true
    sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;" 2>/dev/null || true

    log_info "PostgreSQL setup completed."
}

# 3. Set up Redis (optional)
setup_redis() {
    log_info "Setting up Redis..."
    if ! command -v redis-server &> /dev/null; then
        log_warn "Redis not found. Installing via apt (Linux only)..."
        if [[ "$OS" == "linux" ]]; then
            run_cmd sudo apt-get install -y redis-server
        else
            log_warn "Redis installation skipped. Please install Redis manually for caching."
            return 0
        fi
    fi
    # Start Redis service
    if [[ "$OS" == "linux" ]]; then
        run_cmd sudo systemctl start redis-server || true
        run_cmd sudo systemctl enable redis-server || true
    fi
    log_info "Redis setup completed."
}

# 4. Create environment configuration
create_env_config() {
    log_info "Creating environment configuration files..."
    cd "$PROJECT_ROOT"
    # Client .env
    cat > client/.env << EOF
# Client Environment Variables
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=ws://localhost:3000
VITE_DEBUG=true
EOF
    # Server .env
    cat > server/.env << EOF
# Server Environment Variables
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/phaser_platformer
REDIS_URL=redis://localhost:6379
JWT_SECRET=super_secret_jwt_key_change_in_production
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:8080
EOF
    log_info "Environment files created."
}

# 5. Install dependencies
install_deps() {
    log_info "Installing dependencies..."
    cd "$PROJECT_ROOT"
    run_cmd "$PM" install
    if [[ -d "client" ]]; then
        cd client
        run_cmd "$PM" install
        cd ..
    fi
    if [[ -d "server" ]]; then
        cd server
        run_cmd "$PM" install
        cd ..
    fi
    if [[ -d "shared" ]]; then
        cd shared
        run_cmd "$PM" install
        cd ..
    fi
    log_info "Dependencies installed."
}

# 6. Build the project
build_project() {
    log_info "Building project..."
    cd "$PROJECT_ROOT"
    run_cmd "$PM" run build
    log_info "Build completed."
}

# 7. Run migrations
run_migrations() {
    log_info "Running database migrations..."
    cd "$PROJECT_ROOT/server"
    if [[ -f "src/persistence/database.ts" ]]; then
        # We need to compile TypeScript first
        run_cmd npm run build
        # Run migration via TypeORM (assuming there's a script)
        if grep -q "typeorm" package.json; then
            npx typeorm migration:run || log_warn "Migration failed or already applied."
        fi
    else
        log_warn "No database migration script found. Skipping."
    fi
    log_info "Migrations completed."
}

# Main script
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
log_info "Project root: $PROJECT_ROOT"

# Parse arguments
SKIP_DEPS=false
SKIP_DB=false
SKIP_REDIS=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-deps) SKIP_DEPS=true ;;
        --skip-db) SKIP_DB=true ;;
        --skip-redis) SKIP_REDIS=true ;;
        --skip-build) SKIP_BUILD=true ;;
        *) log_error "Unknown option: $1"; exit 1 ;;
    esac
    shift
done

if [[ "$SKIP_DEPS" != true ]]; then
    fix_dependencies
    install_deps
fi

if [[ "$SKIP_DB" != true ]]; then
    setup_postgres
    run_migrations
fi

if [[ "$SKIP_REDIS" != true ]]; then
    setup_redis
fi

create_env_config

if [[ "$SKIP_BUILD" != true ]]; then
    build_project
fi

log_info "Setup completed successfully!"
log_info "Next steps:"
log_info "1. Start the server: cd server && npm run dev"
log_info "2. Start the client: cd client && npm run dev"
log_info "3. Open browser at http://localhost:8080"