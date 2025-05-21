// Rotas de movimentações
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções de controller simplificadas para teste
const listMovements = (req, res) => {
  res.json({
    status: 'success',
    message: 'Lista de movimentações',
    data: []
  });
};

const getMovementById = (req, res) => {
  res.json({
    status: 'success',
    message: 'Detalhes da movimentação',
    data: { 
      id: req.params.id, 
      tipo: 'promocao', 
      colaboradorId: 'colaborador-id',
      dataEfetivacao: new Date().toISOString(),
      motivo: 'Reconhecimento por desempenho'
    }
  });
};

const createMovement = (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Movimentação criada',
    data: { id: 'novo-id', ...req.body }
  });
};

const updateMovement = (req, res) => {
  res.json({
    status: 'success',
    message: 'Movimentação atualizada',
    data: { id: req.params.id, ...req.body }
  });
};

const approveMovement = (req, res) => {
  res.json({
    status: 'success',
    message: 'Movimentação aprovada',
    data: { id: req.params.id, status: 'aprovado' }
  });
};

const rejectMovement = (req, res) => {
  res.json({
    status: 'success',
    message: 'Movimentação rejeitada',
    data: { id: req.params.id, status: 'rejeitado' }
  });
};

// Rotas
router.get('/', authMiddleware, listMovements);
router.get('/:id', authMiddleware, getMovementById);
router.post('/', authMiddleware, createMovement);
router.put('/:id', authMiddleware, updateMovement);
router.post('/:id/approve', authMiddleware, approveMovement);
router.post('/:id/reject', authMiddleware, rejectMovement);

module.exports = router;
