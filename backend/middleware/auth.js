const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rotas
exports.protect = async (req, res, next) => {
  let token;

  // Verificar se o token existe no header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extrair token do header
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar se o token existe
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado para acessar esta rota'
    });
  }

  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adicionar usuário ao request
    req.user = await User.findById(decoded.id);
    
    // Atualizar último acesso
    await User.findByIdAndUpdate(decoded.id, { ultimoAcesso: Date.now() });

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Não autorizado para acessar esta rota'
    });
  }
};

// Middleware para autorizar por perfil
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: `Perfil ${req.user.perfil} não tem permissão para acessar esta rota`
      });
    }
    next();
  };
};

// Middleware para verificar acesso a departamentos específicos
exports.checkDepartmentAccess = async (req, res, next) => {
  // Admin e Diretor têm acesso a todos os departamentos
  if (['Admin', 'Diretor'].includes(req.user.perfil)) {
    return next();
  }

  // Verificar se o departamento está na lista de departamentos gerenciados
  const departmentId = req.params.id || req.body.departamento;
  
  if (!departmentId) {
    return next();
  }

  const hasAccess = req.user.departamentosGerenciados.some(
    (dep) => dep.toString() === departmentId.toString()
  );

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: 'Você não tem permissão para acessar este departamento'
    });
  }

  next();
};
