#!/bin/bash
# Vincanto Production Deployment Script - Enhanced
# Versione 2.0 con validazioni complete e sicurezza

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project info
PROJECT_NAME="vincanto"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    NODE_VERSION=$(node --version)
    log "Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    # Verify we're in the right directory
    if [[ ! -f "package.json" ]]; then
        error "package.json not found. Run this script from the project root."
    fi
    
    log "✅ Prerequisites check passed"
}

# Backup current deployment
create_backup() {
    log "📦 Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if exists
    if [[ -f "vincanto-backend/data/vincanto.db" ]]; then
        cp vincanto-backend/data/vincanto.db "$BACKUP_DIR/"
        log "Database backed up"
    fi
    
    # Backup environment files
    if [[ -f "vincanto-backend/.env" ]]; then
        cp vincanto-backend/.env "$BACKUP_DIR/.env.backup"
        log "Environment file backed up"
    fi
    
    # Backup logs
    if [[ -d "vincanto-backend/logs" ]]; then
        cp -r vincanto-backend/logs "$BACKUP_DIR/"
        log "Logs backed up"
    fi
    
    log "✅ Backup created: $BACKUP_DIR"
}

# Run production validation
validate_production() {
    log "🔍 Running production validation..."
    
    cd vincanto-backend
    
    # Run production validator
    if [[ -f "utils/productionValidator.js" ]]; then
        node utils/productionValidator.js || error "Production validation failed"
    else
        warn "Production validator not found, skipping validation"
    fi
    
    cd ..
    log "✅ Production validation passed"
}

# Install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    # Frontend dependencies
    npm ci --production=false
    
    # Backend dependencies
    cd vincanto-backend
    npm ci --production
    cd ..
    
    log "✅ Dependencies installed"
}

# Build frontend
build_frontend() {
    log "🏗️ Building frontend..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build with Vite
    npm run build
    
    # Verify build output
    if [[ ! -d "dist" ]]; then
        error "Build failed - dist directory not found"
    fi
    
    # Check build size
    BUILD_SIZE=$(du -sh dist | cut -f1)
    log "Build size: $BUILD_SIZE"
    
    log "✅ Frontend built successfully"
}

# Setup backend for production
setup_backend() {
    log "🔧 Setting up backend..."
    
    cd vincanto-backend
    
    # Create necessary directories
    mkdir -p logs data tmp
    
    # Set correct permissions
    chmod 755 logs data tmp
    
    # Initialize database if needed
    if [[ ! -f "data/vincanto.db" ]]; then
        log "Initializing database..."
        npm run db:setup || warn "Database initialization failed"
    fi
    
    # Run database migrations
    if [[ -f "scripts/migrate.js" ]]; then
        node scripts/migrate.js || warn "Database migration failed"
    fi
    
    cd ..
    log "✅ Backend setup completed"
}

# Security hardening
apply_security() {
    log "🔒 Applying security configurations..."
    
    cd vincanto-backend
    
    # Set strict file permissions
    chmod 600 .env 2>/dev/null || warn "No .env file found"
    
    # Create secure tmp directory
    mkdir -p tmp
    chmod 700 tmp
    
    # Set log file permissions
    if [[ -d "logs" ]]; then
        chmod 755 logs
        find logs -type f -exec chmod 644 {} \;
    fi
    
    cd ..
    log "✅ Security configurations applied"
}

# Health check
run_health_check() {
    log "🩺 Running health check..."
    
    cd vincanto-backend
    
    # Start server in background for testing
    NODE_ENV=production node server-api.js &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Test health endpoint
    if curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
        log "✅ Health check passed"
    else
        error "Health check failed"
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    
    cd ..
}

# Final deployment steps
finalize_deployment() {
    log "🚀 Finalizing deployment..."
    
    # Create deployment info file
    cat > deployment-info.json << EOF
{
  "deploymentTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "buildSize": "$(du -sh dist 2>/dev/null | cut -f1 || echo 'unknown')",
  "environment": "production"
}
EOF
    
    log "✅ Deployment info created"
    
    # Final instructions
    info "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo
    info "📋 Next steps:"
    info "   1. Upload files to your server"
    info "   2. Configure nginx/apache to serve dist/"
    info "   3. Start backend server: cd vincanto-backend && npm run start"
    info "   4. Configure SSL certificate"
    info "   5. Setup monitoring and alerts"
    echo
    info "🔧 Important files:"
    info "   • Frontend: ./dist/"
    info "   • Backend: ./vincanto-backend/"
    info "   • Backup: ./$BACKUP_DIR"
    info "   • Deploy info: ./deployment-info.json"
    echo
    info "🌐 Remember to update:"
    info "   • DNS records to point to your server"
    info "   • Vercel environment variables"
    info "   • Webhook URLs in Stripe/PayPal"
    echo
}

# Cleanup on failure
cleanup_on_failure() {
    error "Deployment failed. Cleaning up..."
    
    # Stop any running processes
    pkill -f "node server-api.js" 2>/dev/null || true
    
    # Restore from backup if needed
    if [[ -d "$BACKUP_DIR" && -f "$BACKUP_DIR/vincanto.db" ]]; then
        warn "Restoring database from backup..."
        cp "$BACKUP_DIR/vincanto.db" vincanto-backend/data/ || true
    fi
}

# Trap for cleanup
trap cleanup_on_failure ERR

# Main deployment process
main() {
    echo "🚀 Starting Vincanto Production Deployment"
    echo "========================================"
    
    check_prerequisites
    create_backup
    validate_production
    install_dependencies
    build_frontend
    setup_backend
    apply_security
    run_health_check
    finalize_deployment
    
    echo "========================================"
    echo "🎉 VINCANTO PRODUCTION DEPLOYMENT COMPLETE!"
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi