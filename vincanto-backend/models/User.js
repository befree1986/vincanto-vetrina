/**
 * User Model
 * Modello per gli utenti amministratori del sistema
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'super_admin'),
    defaultValue: 'admin',
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_changed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  two_factor_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      unique: true,
      fields: ['email']
    }
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
        user.password_changed_at = new Date();
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password_hash')) {
        user.password_hash = await bcrypt.hash(user.password_hash, 12);
        user.password_changed_at = new Date();
      }
    }
  }
});

// Metodi di istanza
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

User.prototype.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

User.prototype.incrementLoginAttempts = async function() {
  // Se account già bloccato e tempo scaduto, resetta tentativi
  if (this.locked_until && this.locked_until < new Date()) {
    return await this.update({
      login_attempts: 1,
      locked_until: null
    });
  }
  
  const updates = { login_attempts: this.login_attempts + 1 };
  
  // Blocca account dopo 5 tentativi falliti
  if (this.login_attempts + 1 >= 5) {
    updates.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti
  }
  
  return await this.update(updates);
};

User.prototype.resetLoginAttempts = async function() {
  return await this.update({
    login_attempts: 0,
    locked_until: null,
    last_login: new Date()
  });
};

User.prototype.toSafeJSON = function() {
  const user = this.toJSON();
  delete user.password_hash;
  delete user.two_factor_secret;
  return user;
};

// Metodi statici
User.createAdmin = async function(userData) {
  // Hash della password se fornita in chiaro
  if (userData.password && !userData.password_hash) {
    userData.password_hash = await bcrypt.hash(userData.password, 12);
    delete userData.password; // Rimuovi la password in chiaro
  }
  
  return await User.create({
    ...userData,
    role: userData.role || 'admin'
  });
};

User.createSuperAdmin = async function(userData) {
  // Hash della password se fornita in chiaro
  if (userData.password && !userData.password_hash) {
    userData.password_hash = await bcrypt.hash(userData.password, 12);
    delete userData.password; // Rimuovi la password in chiaro
  }
  
  return await User.create({
    ...userData,
    role: 'super_admin'
  });
};

User.findByUsernameOrEmail = async function(identifier) {
  return await User.findOne({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { username: identifier },
        { email: identifier }
      ]
    }
  });
};

module.exports = User;