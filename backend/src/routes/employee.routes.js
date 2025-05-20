// Rotas de colaboradores
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções de controller simplificadas para teste
const listEmployees = (req, res) => {
  res.json({
    status: 'success',
    message: 'Lista de colaboradores',
    data: []
  });
};

const getEmployeeById = (req, res) => {
  res.json({
    status: 'success',
    message: 'Detalhes do colaborador',
    data: { id: req.params.id, nome: 'Colaborador Teste' }
  });
};

const createEmployee = (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Colaborador criado',
    data: { id: 'novo-id', ...req.body }
  });
};

const updateEmployee = (req, res) => {
  res.json({
    status: 'success',
    message: 'Colaborador atualizado',
    data: { id: req.params.id, ...req.body }
  });
};

const deactivateEmployee = (req, res) => {
  res.json({
    status: 'success',
    message: 'Colaborador desativado'
  });
};

// Rotas
router.get('/', authMiddleware, listEmployees);
router.get('/:id', authMiddleware, getEmployeeById);
router.post('/', authMiddleware, createEmployee);
router.put('/:id', authMiddleware, updateEmployee);
router.delete('/:id', authMiddleware, deactivateEmployee);

module.exports = router;
