// Rotas de departamentos
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções de controller simplificadas para teste
const listDepartments = (req, res) => {
  res.json({
    status: 'success',
    message: 'Lista de departamentos',
    data: []
  });
};

const getDepartmentById = (req, res) => {
  res.json({
    status: 'success',
    message: 'Detalhes do departamento',
    data: { id: req.params.id, nome: 'Departamento Teste' }
  });
};

const createDepartment = (req, res) => {
  res.status(201).json({
    status: 'success',
    message: 'Departamento criado',
    data: { id: 'novo-id', ...req.body }
  });
};

const updateDepartment = (req, res) => {
  res.json({
    status: 'success',
    message: 'Departamento atualizado',
    data: { id: req.params.id, ...req.body }
  });
};

const deactivateDepartment = (req, res) => {
  res.json({
    status: 'success',
    message: 'Departamento desativado'
  });
};

// Rotas
router.get('/', authMiddleware, listDepartments);
router.get('/:id', authMiddleware, getDepartmentById);
router.post('/', authMiddleware, createDepartment);
router.put('/:id', authMiddleware, updateDepartment);
router.delete('/:id', authMiddleware, deactivateDepartment);

module.exports = router;
