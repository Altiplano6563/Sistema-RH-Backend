// Rotas de usuário
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções de controller simplificadas para teste
const listUsers = (req, res) => {
  res.json({
    status: 'success',
    message: 'Lista de usuários',
    data: []
  });
};

const getUserById = (req, res) => {
  res.json({
    status: 'success',
    message: 'Detalhes do usuário',
    data: { id: req.params.id, nome: 'Usuário Teste' }
  });
};

const createUser = (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Usuário criado',
    data: { id: 'novo-id', ...req.body }
  });
};

const updateUser = (req, res) => {
  res.json({
    status: 'success',
    message: 'Usuário atualizado',
    data: { id: req.params.id, ...req.body }
  });
};

const deactivateUser = (req, res) => {
  res.json({
    status: 'success',
    message: 'Usuário desativado'
  });
};

const exportPersonalData = (req, res) => {
  res.json({
    status: 'success',
    message: 'Dados pessoais exportados',
    data: { id: req.params.id, nome: 'Usuário Teste' }
  });
};

const anonymizeUser = (req, res) => {
  res.json({
    status: 'success',
    message: 'Dados anonimizados'
  });
};

// Rotas
router.get('/', authMiddleware, listUsers);
router.get('/:id', authMiddleware, getUserById);
router.post('/', authMiddleware, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deactivateUser);
router.get('/:id/personal-data', authMiddleware, exportPersonalData);
router.post('/:id/anonymize', authMiddleware, anonymizeUser);

module.exports = router;
