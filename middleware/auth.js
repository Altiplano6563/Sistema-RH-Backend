const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para proteger rotas que requerem autenticação
 */
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se o token está presente no header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Acesso não autorizado'
    });
  }

  try {
    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar o usuário pelo ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Adicionar o usuário ao objeto de requisição
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado'
    });
  }
};

/**
 * Middleware para restringir acesso baseado em perfis
 * @param {...String} roles - Perfis permitidos
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Acesso não autorizado'
      });
    }

    if (!roles.includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para acessar este recurso'
      });
    }

    next();
  };
};
