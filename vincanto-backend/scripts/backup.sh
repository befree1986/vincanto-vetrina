#!/bin/bash

###############################################################################
# Vincanto Backup Script
# Automated backup for database, configurations, and logs
###############################################################################

# Configuration
BACKUP_DIR="/var/backups/vincanto"
PROJECT_DIR="/var/www/vincanto"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backup directory
log "Creating backup directory..."
mkdir -p $BACKUP_DIR/{database,config,logs}

# Change to project directory
cd $PROJECT_DIR || { error "Cannot access project directory: $PROJECT_DIR"; exit 1; }

# 1. Database Backup
log "Backing up database..."
DB_FILE="./vincanto-backend/data/vincanto_production.db"

if [ -f "$DB_FILE" ]; then
    cp "$DB_FILE" "$BACKUP_DIR/database/vincanto_db_$DATE.db"
    
    # Compress database backup
    gzip "$BACKUP_DIR/database/vincanto_db_$DATE.db"
    
    log "Database backup completed: vincanto_db_$DATE.db.gz"
else
    warning "Database file not found: $DB_FILE"
fi

# 2. Configuration Backup
log "Backing up configurations..."
tar -czf "$BACKUP_DIR/config/vincanto_config_$DATE.tar.gz" \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='data' \
    --exclude='.git' \
    ./

log "Configuration backup completed: vincanto_config_$DATE.tar.gz"

# 3. Logs Backup
log "Backing up logs..."
if [ -d "./vincanto-backend/logs" ]; then
    tar -czf "$BACKUP_DIR/logs/vincanto_logs_$DATE.tar.gz" ./vincanto-backend/logs/
    log "Logs backup completed: vincanto_logs_$DATE.tar.gz"
else
    warning "Logs directory not found"
fi

# 4. Export Database Data (JSON)
log "Exporting database data to JSON..."
cd vincanto-backend || exit 1

# Export users (without passwords)
node -e "
const { models } = require('./models');
(async () => {
  try {
    const users = await models.User.findAll({
      attributes: { exclude: ['password_hash', 'two_factor_secret'] }
    });
    const bookings = await models.Booking.findAll();
    const pricingConfigs = await models.PricingConfig.findAll();
    const calendarConfigs = await models.CalendarConfig.findAll();
    const systemSettings = await models.SystemSettings.findAll();
    
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      data: {
        users: users,
        bookings: bookings,
        pricing_configs: pricingConfigs,
        calendar_configs: calendarConfigs,
        system_settings: systemSettings
      }
    };
    
    console.log(JSON.stringify(exportData, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
})();
" > "$BACKUP_DIR/database/vincanto_export_$DATE.json"

if [ $? -eq 0 ]; then
    gzip "$BACKUP_DIR/database/vincanto_export_$DATE.json"
    log "Database export completed: vincanto_export_$DATE.json.gz"
else
    error "Database export failed"
fi

cd .. || exit 1

# 5. System Information
log "Collecting system information..."
{
    echo "=== Backup Information ==="
    echo "Date: $(date)"
    echo "Server: $(hostname)"
    echo "User: $(whoami)"
    echo "Disk Usage: $(df -h /)"
    echo "Memory Usage: $(free -h)"
    echo ""
    echo "=== Application Status ==="
    pm2 list
    echo ""
    echo "=== File Sizes ==="
    du -sh $BACKUP_DIR/database/vincanto_db_$DATE.db.gz 2>/dev/null || echo "DB backup: N/A"
    du -sh $BACKUP_DIR/config/vincanto_config_$DATE.tar.gz 2>/dev/null || echo "Config backup: N/A"
    du -sh $BACKUP_DIR/logs/vincanto_logs_$DATE.tar.gz 2>/dev/null || echo "Logs backup: N/A"
} > "$BACKUP_DIR/backup_info_$DATE.txt"

# 6. Cleanup old backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -exec rm -f {} \;
log "Cleanup completed"

# 7. Verify backups
log "Verifying backups..."
BACKUP_COUNT=$(find $BACKUP_DIR -name "*$DATE*" | wc -l)
if [ $BACKUP_COUNT -gt 0 ]; then
    log "Backup verification successful: $BACKUP_COUNT files created"
else
    error "Backup verification failed: no files created"
    exit 1
fi

# 8. Send notification (optional)
if command -v mail &> /dev/null && [ -n "$BACKUP_EMAIL" ]; then
    {
        echo "Vincanto backup completed successfully"
        echo "Date: $(date)"
        echo "Server: $(hostname)"
        echo "Files created: $BACKUP_COUNT"
        echo ""
        cat "$BACKUP_DIR/backup_info_$DATE.txt"
    } | mail -s "Vincanto Backup Report - $DATE" "$BACKUP_EMAIL"
    
    log "Backup notification sent to $BACKUP_EMAIL"
fi

# 9. Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ] && command -v aws &> /dev/null; then
    log "Uploading to AWS S3..."
    aws s3 sync $BACKUP_DIR s3://$AWS_S3_BUCKET/vincanto-backups/ --delete
    log "S3 upload completed"
fi

log "Backup process completed successfully!"

# Summary
echo ""
echo "========================================="
echo "           BACKUP SUMMARY"
echo "========================================="
echo "Date: $(date)"
echo "Backup Directory: $BACKUP_DIR"
echo "Files Created:"
ls -lah $BACKUP_DIR/*/$DATE* 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'
echo "Total Backup Size: $(du -sh $BACKUP_DIR | cut -f1)"
echo "========================================="