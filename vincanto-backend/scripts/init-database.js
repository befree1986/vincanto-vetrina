#!/usr/bin/env node

/**
 * Database Initialization Script
 * Script per inizializzare il database con dati di default
 */

const { setupDatabase, resetDatabase, getDatabaseStats } = require('../models');

// Configurazione
const args = process.argv.slice(2);
const command = args[0];

// Funzioni helper
const showUsage = () => {
  console.log(`
Vincanto Database Management

Usage: node scripts/init-database.js [command]

Commands:
  setup     - Initialize database with default data (safe, won't overwrite)
  reset     - Reset database and recreate all tables (DESTRUCTIVE!)
  stats     - Show database statistics
  help      - Show this help message

Examples:
  node scripts/init-database.js setup
  node scripts/init-database.js stats
  
Note: Reset command only works in development environment
`);
};

const showStats = async () => {
  try {
    console.log('📊 Database Statistics\n');
    
    const stats = await getDatabaseStats();
    
    if (!stats) {
      console.log('❌ Could not retrieve database statistics');
      return;
    }
    
    console.log('📋 Record Counts:');
    console.log(`  Users: ${stats.users}`);
    console.log(`  Bookings: ${stats.bookings}`);
    console.log(`  Payments: ${stats.payments}`);
    console.log(`  Pricing Configs: ${stats.pricing_configs}`);
    console.log(`  Calendar Configs: ${stats.calendar_configs}`);
    console.log(`  System Settings: ${stats.system_settings}`);
    
    if (stats.bookings_by_status && stats.bookings_by_status.length > 0) {
      console.log('\n📈 Bookings by Status:');
      stats.bookings_by_status.forEach(stat => {
        console.log(`  ${stat.status}: ${stat.count} bookings (€${stat.total_amount || 0})`);
      });
    }
    
    if (stats.revenue_stats && stats.revenue_stats.length > 0) {
      console.log('\n💰 Revenue Summary (Year to Date):');
      const totalRevenue = stats.revenue_stats.reduce((sum, stat) => sum + parseFloat(stat.net_revenue || 0), 0);
      const totalTransactions = stats.revenue_stats.reduce((sum, stat) => sum + parseInt(stat.transaction_count || 0), 0);
      
      console.log(`  Total Revenue: €${totalRevenue.toFixed(2)}`);
      console.log(`  Total Transactions: ${totalTransactions}`);
      console.log(`  Average Transaction: €${totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(2) : 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error retrieving statistics:', error.message);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  console.log('🏠 Vincanto Database Management\n');
  
  switch (command) {
    case 'setup':
      console.log('🚀 Setting up database...\n');
      try {
        const success = await setupDatabase();
        if (success) {
          console.log('\n✅ Database setup completed successfully!');
          
          console.log('\n📋 Default Admin Credentials:');
          console.log('  Username: admin');
          console.log('  Email: admin@vincantomaori.it');
          console.log('  Password: VincantoAdmin2024!');
          console.log('\n⚠️  Please change the default password after first login!');
          
          await showStats();
          process.exit(0);
        } else {
          console.log('\n❌ Database setup failed!');
          process.exit(1);
        }
      } catch (error) {
        console.error('\n❌ Setup error:', error.message);
        process.exit(1);
      }
      break;
      
    case 'reset':
      if (process.env.NODE_ENV === 'production') {
        console.log('❌ Database reset is not allowed in production environment!');
        process.exit(1);
      }
      
      console.log('⚠️  WARNING: This will delete all existing data!');
      console.log('⚠️  This operation cannot be undone!');
      
      // In a real CLI, you'd prompt for confirmation here
      console.log('\n🔄 Resetting database...\n');
      
      try {
        const success = await resetDatabase();
        if (success) {
          console.log('\n✅ Database reset completed successfully!');
          await showStats();
          process.exit(0);
        } else {
          console.log('\n❌ Database reset failed!');
          process.exit(1);
        }
      } catch (error) {
        console.error('\n❌ Reset error:', error.message);
        process.exit(1);
      }
      break;
      
    case 'stats':
      await showStats();
      process.exit(0);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showUsage();
      process.exit(0);
      break;
      
    default:
      if (command) {
        console.log(`❌ Unknown command: ${command}\n`);
      }
      showUsage();
      process.exit(1);
  }
};

// Gestione errori
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

// Esegui script
main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});