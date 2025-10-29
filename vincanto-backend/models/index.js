/**
 * Models Index
 * Configurazione e relazioni tra tutti i modelli del database
 */

const { sequelize } = require('../config/database');

// Importa tutti i modelli
const User = require('./User');
const Booking = require('./Booking');
const Payment = require('./Payment');
const PricingConfig = require('./PricingConfig');
const CalendarConfig = require('./CalendarConfig');
const SystemSettings = require('./SystemSettings');

// Definisci le relazioni tra i modelli
const initializeRelations = () => {
  
  // User relationships - RIMOSSO created_by da Booking (campo inesistente)
  User.hasMany(SystemSettings, {
    foreignKey: 'last_updated_by',
    as: 'updatedSettings'
  });
  
  // Booking relationships - RIMOSSA relazione con User per created_by
  
  Booking.hasMany(Payment, {
    foreignKey: 'booking_id',
    as: 'payments',
    onDelete: 'CASCADE'
  });
  
  // Payment relationships
  Payment.belongsTo(Booking, {
    foreignKey: 'booking_id',
    as: 'booking'
  });
  
  // SystemSettings relationships
  SystemSettings.belongsTo(User, {
    foreignKey: 'last_updated_by',
    as: 'updatedBy'
  });
  
  console.log('✅ Model relationships initialized');
};

// Inizializza il database
const initializeDatabase = async () => {
  try {
    // Test connessione
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Inizializza relazioni
    initializeRelations();
    
    // Sincronizza modelli (crea tabelle se non esistono)
    await sequelize.sync({ alter: false }); // Non modificare tabelle esistenti
    console.log('✅ Database models synchronized');
    
    // Inizializza settings di default
    const settingsCount = await SystemSettings.initializeDefaults();
    console.log(`✅ System settings initialized (${settingsCount} defaults)`);
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Funzione per creare admin di default
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      where: { role: 'super_admin' }
    });
    
    if (!adminExists) {
      const admin = await User.createAdmin({
        username: 'admin',
        email: 'admin@vincantomaori.it',
        password: 'VincantoAdmin2024!',
        role: 'super_admin'
      });
      
      console.log('✅ Default admin user created:', {
        id: admin.id,
        username: admin.username,
        email: admin.email
      });
      
      return admin;
    } else {
      console.log('ℹ️ Admin user already exists');
      return adminExists;
    }
  } catch (error) {
    console.error('❌ Failed to create default admin:', error);
    throw error;
  }
};

// Funzione per creare configurazioni di prezzo di default
const createDefaultPricing = async () => {
  try {
    const existingConfigs = await PricingConfig.count();
    
    if (existingConfigs === 0) {
      await PricingConfig.createSeasonalRates();
      console.log('✅ Default pricing configurations created');
    } else {
      console.log('ℹ️ Pricing configurations already exist');
    }
  } catch (error) {
    console.error('❌ Failed to create default pricing:', error);
    throw error;
  }
};

// Funzione per setup completo del database
const setupDatabase = async () => {
  try {
    console.log('🚀 Starting database setup...');
    
    await initializeDatabase();
    await createDefaultAdmin();
    await createDefaultPricing();
    
    console.log('✅ Database setup completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
};

// Funzione per reset del database (solo per development)
const resetDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database reset is not allowed in production');
  }
  
  try {
    console.log('⚠️ Resetting database...');
    
    // Drop e ricrea tutte le tabelle
    await sequelize.sync({ force: true });
    console.log('✅ Database tables recreated');
    
    // Reinizializza tutto
    await setupDatabase();
    
    console.log('✅ Database reset completed');
    return true;
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    return false;
  }
};

// Funzione per statistiche database
const getDatabaseStats = async () => {
  try {
    const stats = {
      users: await User.count(),
      bookings: await Booking.count(),
      payments: await Payment.count(),
      pricing_configs: await PricingConfig.count(),
      calendar_configs: await CalendarConfig.count(),
      system_settings: await SystemSettings.count(),
      
      // Statistiche dettagliate
      bookings_by_status: await Booking.getBookingStats(),
      revenue_stats: await Payment.getRevenueByPeriod(
        new Date(new Date().getFullYear(), 0, 1), // Inizio anno
        new Date() // Oggi
      )
    };
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    return null;
  }
};

// Funzione di backup (esporta dati in JSON)
const exportData = async () => {
  try {
    const data = {
      timestamp: new Date().toISOString(),
      users: await User.findAll({
        attributes: { exclude: ['password_hash'] } // Escludi password
      }),
      bookings: await Booking.findAll(),
      payments: await Payment.findAll(),
      pricing_configs: await PricingConfig.findAll(),
      calendar_configs: await CalendarConfig.findAll(),
      system_settings: await SystemSettings.findAll()
    };
    
    return data;
  } catch (error) {
    console.error('❌ Failed to export data:', error);
    throw error;
  }
};

// Esporta modelli e utility
module.exports = {
  // Database connection
  sequelize,
  
  // Models
  User,
  Booking,
  Payment,
  PricingConfig,
  CalendarConfig,
  SystemSettings,
  
  // Initialization functions
  initializeDatabase,
  initializeRelations,
  setupDatabase,
  resetDatabase,
  
  // Utility functions
  createDefaultAdmin,
  createDefaultPricing,
  getDatabaseStats,
  exportData,
  
  // Utility object per accesso rapido
  models: {
    User,
    Booking,
    Payment,
    PricingConfig,
    CalendarConfig,
    SystemSettings
  }
};