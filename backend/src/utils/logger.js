const winston = require('winston');

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sistema-rh-backend' },
  transports: [
    // Escreve todos os logs com nível 'error' ou inferior para 'error.log'
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Escreve todos os logs com nível 'info' ou inferior para 'combined.log'
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Se não estamos em produção, também logamos para o console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Função para mascarar dados sensíveis nos logs
logger.maskSensitiveData = (data) => {
  if (!data) return data;
  
  const maskedData = { ...data };
  
  // Lista de campos sensíveis para mascarar
  const sensitiveFields = ['senha', 'password', 'token', 'cpf', 'rg', 'email', 'telefone'];
  
  // Função recursiva para mascarar campos em objetos aninhados
  const maskRecursive = (obj) => {
    if (typeof obj !== 'object' || obj === null) return;
    
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        if (typeof obj[key] === 'string') {
          // Mascara o valor mantendo apenas os primeiros e últimos caracteres
          const value = obj[key];
          const firstChars = value.substring(0, 2);
          const lastChars = value.substring(value.length - 2);
          obj[key] = `${firstChars}${'*'.repeat(6)}${lastChars}`;
        } else {
          obj[key] = '******';
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        maskRecursive(obj[key]);
      }
    });
  };
  
  maskRecursive(maskedData);
  return maskedData;
};

module.exports = logger;
