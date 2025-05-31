// Rotas de cargos
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções de controller simplificadas para teste
const listPositions = (req, res) => {
  res.json({
    status: 'success',
    message: 'Lista de cargos',
    data: []
  });
};

const getPositionById = (req, res) => {
  res.json({
    status: 'success',
    message: 'Detalhes do cargo',
    data: { id: req.params.id, nome: 'Cargo Teste', nivel: 'Júnior' }
  });
};

const createPosition = (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Cargo criado',
    data: { id: 'novo-id', ...req.body }
  });
};

const updatePosition = (req, res) => {
  res.json({
    status: 'success',
    message: 'Cargo atualizado',
    data: { id: req.params.id, ...req.body }
  });
};

const deactivatePosition = (req, res) => {
  res.json({
    status: 'success',
    message: 'Cargo desativado'
  });
};

// Rotas
router.get('/', authMiddleware, listPositions);
router.get('/:id', authMiddleware, getPositionById);
router.post('/', authMiddleware, createPosition);
router.put('/:id', authMiddleware, updatePosition);
router.delete('/:id', authMiddleware, deactivatePosition);

module.exports = router;
