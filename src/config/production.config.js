// Configuração de produção para o backend
require('dotenv').config();

module.exports = {
  // Configuração do servidor
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  },
  
  // Configuração do banco de dados
  database: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'sistema_rh',
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // Configuração JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'sistema-rh-online-jwt-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sistema-rh-online-jwt-refresh-secret',
    expiresIn: '1h',
    refreshExpiresIn: '7d'
  },
  
  // Configuração de segurança
  security: {
    saltRounds: 12,
    encryptionKey: process.env.ENCRYPTION_KEY || 'sistema-rh-online-encryption-key-32ch',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // limite de 100 requisições por IP
    }
  },
  
  // Configuração de logs
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    sensitiveFields: [
      'senha', 'password', 'token', 'cpf', 'rg', 
      'email', 'telefone', 'endereco'
    ]
  },
  
  // Configuração LGPD
  lgpd: {
    dataRetentionDays: 365,
    anonymizeInactiveUsers: true,
    userDataExportEnabled: true,
    consentRequired: true
  }
};
