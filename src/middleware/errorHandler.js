// Middleware de tratamento de erros
const logger = require('../utils/logger');

/**
 * Middleware para tratamento centralizado de erros
 */
const errorHandler = (err, req, res, next) => {
  // Registrar erro no log
  logger.error('Erro na aplicação', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Verificar tipo de erro
  if (err.name === 'SequelizeValidationError') {
    // Erro de validação do Sequelize
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    // Erro de restrição única do Sequelize
    return res.status(409).json({
      status: 'error',
      message: 'Registro duplicado',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'JsonWebTokenError') {
    // Erro de token JWT
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido'
    });
  }

  if (err.name === 'TokenExpiredError') {
    // Erro de token JWT expirado
    return res.status(401).json({
      status: 'error',
      message: 'Token expirado'
    });
  }

  // Verificar se o erro tem status code definido
  const statusCode = err.statusCode || 500;

  // Resposta padrão para erros
  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor'
  });
};

module.exports = errorHandler;
