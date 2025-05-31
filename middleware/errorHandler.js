/**
 * Middleware para tratamento centralizado de erros
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Verificar se é um erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Erro de validação',
      details: Object.values(err.errors).map(val => val.message)
    });
  }

  // Verificar se é um erro de autenticação JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }

  // Verificar se é um erro de expiração JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expirado'
    });
  }

  // Verificar se é um erro de MongoDB
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Dados duplicados',
      field: Object.keys(err.keyValue)[0]
    });
  }

  // Erro de servidor padrão
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Erro no servidor',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
