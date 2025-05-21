module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'sistema-rh-online-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sistema-rh-online-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
  },
  security: {
    saltRounds: 10,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutos
    rateLimitMax: 100, // 100 requisições por janela
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  },
  app: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
  }
};
