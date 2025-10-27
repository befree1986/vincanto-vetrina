#!/bin/bash

###############################################################################
# Vincanto Deploy Script
# Automated deployment for production environment
###############################################################################

# Configuration
PROJECT_NAME="vincanto"
REPO_URL="https://github.com/your-username/vincanto.git"
DEPLOY_DIR="/var/www/vincanto"
BACKUP_DIR="/var/backups/vincanto"
LOG_FILE="/var/log/vincanto-deploy.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a $LOG_FILE
}

# Error handling
set -e
trap 'error "Deploy failed at line $LINENO. Check logs: $LOG_FILE"' ERR

# Start deploy
log "🚀 Starting Vincanto deployment..."

# 1. Pre-deployment checks
info "Performing pre-deployment checks..."

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
    error "Don't run this script as root"
    exit 1
fi

# Check dependencies
command -v node >/dev/null 2>&1 || { error "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { error "npm is required but not installed."; exit 1; }
command -v pm2 >/dev/null 2>&1 || { error "PM2 is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { error "Git is required but not installed."; exit 1; }

log "✅ Pre-deployment checks passed"

# 2. Backup current deployment
info "Creating backup of current deployment..."
if [ -d "$DEPLOY_DIR" ]; then
    BACKUP_NAME="vincanto_pre_deploy_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$DEPLOY_DIR" . 2>/dev/null || warning "Backup creation failed"
    log "✅ Backup created: $BACKUP_NAME.tar.gz"
else
    info "No existing deployment found, skipping backup"
fi

# 3. Stop current application
info "Stopping current application..."
pm2 stop $PROJECT_NAME 2>/dev/null || info "No running application found"

# 4. Clone/Update repository
if [ ! -d "$DEPLOY_DIR" ]; then
    info "Cloning repository..."
    git clone "$REPO_URL" "$DEPLOY_DIR"
else
    info "Updating repository..."
    cd "$DEPLOY_DIR"
    git fetch origin
    git reset --hard origin/master
fi

cd "$DEPLOY_DIR"
log "✅ Repository updated"

# 5. Install dependencies
info "Installing backend dependencies..."
cd vincanto-backend
npm install --production

info "Installing frontend dependencies..."
cd ../
npm install

log "✅ Dependencies installed"

# 6. Build frontend
info "Building frontend..."
npm run build

# Copy built files to backend public directory (if needed)
if [ -d "dist" ]; then
    mkdir -p vincanto-backend/public
    cp -r dist/* vincanto-backend/public/
    log "✅ Frontend built and copied"
fi

# 7. Database migration
info "Running database setup..."
cd vincanto-backend
NODE_ENV=production npm run db:setup

log "✅ Database setup completed"

# 8. Environment configuration
info "Checking environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        warning "No .env file found. Copy .env.example and configure it:"
        warning "cp .env.example .env"
        error "Please configure .env file before deployment"
        exit 1
    else
        error "No .env.example file found"
        exit 1
    fi
else
    log "✅ Environment file exists"
fi

# 9. Set permissions
info "Setting file permissions..."
chmod +x scripts/*.sh 2>/dev/null || true
chmod 755 server-api.js

# Create logs directory
mkdir -p logs
chmod 755 logs

log "✅ Permissions set"

# 10. Start application with PM2
info "Starting application with PM2..."
cd "$DEPLOY_DIR"

# Delete existing PM2 process
pm2 delete $PROJECT_NAME 2>/dev/null || info "No existing PM2 process"

# Start new process
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

log "✅ Application started with PM2"

# 11. Health check
info "Performing health check..."
sleep 5

# Check if application is running
if pm2 list | grep -q "$PROJECT_NAME.*online"; then
    log "✅ Application is running"
else
    error "Application failed to start"
    pm2 logs $PROJECT_NAME --lines 20
    exit 1
fi

# Test API endpoint
if curl -f -s http://localhost:3000/health >/dev/null 2>&1; then
    log "✅ Health check passed"
else
    warning "Health check failed - application may still be starting"
fi

# 12. Update Nginx configuration (if needed)
info "Updating web server configuration..."
if [ -f "/etc/nginx/sites-available/$PROJECT_NAME" ]; then
    sudo nginx -t && sudo systemctl reload nginx
    log "✅ Nginx configuration updated"
else
    warning "Nginx configuration not found"
fi

# 13. Post-deployment tasks
info "Running post-deployment tasks..."

# Clear any caches
pm2 flush $PROJECT_NAME

# Update system settings
cd "$DEPLOY_DIR/vincanto-backend"
node -e "
const { SystemSettings } = require('./models');
(async () => {
  try {
    await SystemSettings.set('last_deployed_at', new Date().toISOString());
    console.log('Deployment timestamp updated');
  } catch (error) {
    console.error('Failed to update deployment timestamp:', error);
  }
  process.exit(0);
})();
"

log "✅ Post-deployment tasks completed"

# 14. Cleanup old backups
info "Cleaning up old backups..."
find "$BACKUP_DIR" -name "vincanto_pre_deploy_*" -mtime +7 -delete 2>/dev/null || true
log "✅ Cleanup completed"

# 15. Final status
echo ""
echo "========================================="
echo "         DEPLOYMENT COMPLETED"
echo "========================================="
echo "Project: $PROJECT_NAME"
echo "Date: $(date)"
echo "Deployed to: $DEPLOY_DIR"
echo "PM2 Status:"
pm2 list | grep $PROJECT_NAME
echo ""
echo "Application URL: http://localhost:3000"
echo "Health Check: http://localhost:3000/health"
echo "API Documentation: http://localhost:3000/api"
echo ""
echo "Logs:"
echo "  Application: pm2 logs $PROJECT_NAME"
echo "  Deploy: $LOG_FILE"
echo "========================================="

log "🎉 Deployment completed successfully!"

# Send notification (optional)
if command -v mail &> /dev/null && [ -n "$DEPLOY_EMAIL" ]; then
    {
        echo "Vincanto deployment completed successfully"
        echo "Date: $(date)"
        echo "Server: $(hostname)"
        echo "Version: $(git rev-parse --short HEAD)"
    } | mail -s "Vincanto Deployment Success" "$DEPLOY_EMAIL"
fi