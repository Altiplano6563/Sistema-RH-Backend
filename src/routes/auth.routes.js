// Rotas de autenticação
const express = require('express');
const router = express.Router();

// Funções de controller simplificadas para teste
const login = (req, res) => {
  res.json({
    status: 'success',
    message: 'Login realizado com sucesso',
    data: {
      accessToken: 'token-de-acesso-simulado',
      refreshToken: 'token-de-refresh-simulado',
      user: {
        id: 'user-id',
        nome: 'Usuário Teste',
        email: req.body.email,
        perfil: 'admin'
      }
    }
  });
};

const refreshToken = (req, res) => {
  res.json({
    status: 'success',
    message: 'Token atualizado com sucesso',
    data: {
      accessToken: 'novo-token-de-acesso-simulado',
      refreshToken: 'novo-token-de-refresh-simulado'
    }
  });
};

const logout = (req, res) => {
  res.json({
    status: 'success',
    message: 'Logout realizado com sucesso'
  });
};

const check = (req, res) => {
  res.json({
    status: 'success',
    message: 'Token válido',
    data: {
      id: 'user-id',
      nome: 'Usuário Teste',
      email: 'teste@empresa.com',
      perfil: 'admin'
    }
  });
};

// Rotas
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/check', check);

module.exports = router;
