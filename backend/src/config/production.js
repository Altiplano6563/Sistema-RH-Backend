// Arquivo para configuração do ambiente de produção
// Configurações para deploy do sistema de RH online

module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0', // Permite acesso externo
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  },
  
  // Configurações de banco de dados para produção
  database: {
    useSSL: true,
    poolConfig: {
      max: 20,
      min: 5,
      idle: 10000,
      acquire: 30000,
    },
    logging: false,
  },
  
  // Configurações de segurança
  security: {
    jwtExpiresIn: '1h',
    jwtRefreshExpiresIn: '7d',
    bcryptRounds: 12,
    rateLimitRequests: 100,
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'", "https://api.sistema-rh.com.br"],
        },
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
    },
  },
  
  // Configurações de logs
  logging: {
    level: 'info',
    format: 'json',
    sensitiveFields: [
      'senha', 'password', 'token', 'cpf', 'rg', 
      'email', 'telefone', 'endereco'
    ],
  },
  
  // Configurações de cache
  cache: {
    ttl: 60 * 5, // 5 minutos em segundos
    checkPeriod: 60, // Verificar expiração a cada 1 minuto
  },
  
  // Configurações de upload
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg', 
      'image/png', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    storageType: 's3', // local ou s3
  },
  
  // Configurações de email
  email: {
    from: 'no-reply@sistema-rh.com.br',
    templates: {
      welcome: 'welcome-email',
      resetPassword: 'reset-password',
      movementApproval: 'movement-approval',
    },
  },
  
  // Configurações de monitoramento
  monitoring: {
    enabled: true,
    errorTracking: true,
    performanceMonitoring: true,
  },
  
  // Configurações de LGPD
  lgpd: {
    dataRetentionDays: 365, // Tempo de retenção de dados pessoais
    anonymizeInactiveUsers: true, // Anonimizar usuários inativos após período
    userDataExportEnabled: true, // Permitir exportação de dados do usuário
    consentRequired: true, // Exigir consentimento para coleta de dados
  },
};
