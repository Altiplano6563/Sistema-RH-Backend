// Middleware de autenticação
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Middleware para verificar autenticação via JWT
 */
const authMiddleware = (req, res, next) => {
  try {
    // Obter token do cabeçalho Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Token de autenticação não fornecido'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Adicionar dados do usuário ao objeto de requisição
    req.user = {
      id: decoded.userId,
      tenantId: decoded.tenantId,
      email: decoded.email,
      perfil: decoded.perfil,
      tokenVersion: decoded.tokenVersion
    };
    
    // Prosseguir para o próximo middleware/controlador
    next();
  } catch (error) {
    // Tratar erros específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expirado'
      });
    }
    
    // Registrar erro nos logs
    logger.error('Erro na autenticação', { error: error.message });
    
    // Retornar erro genérico
    return res.status(401).json({
      status: 'error',
      message: 'Falha na autenticação'
    });
  }
};

module.exports = authMiddleware;
