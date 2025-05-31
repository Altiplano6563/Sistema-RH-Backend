const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// @route   GET /api/employees
// @desc    Obter todos os funcionários
// @access  Private
router.get('/', protect, employeeController.getAllEmployees);

// @route   GET /api/employees/:id
// @desc    Obter funcionário por ID
// @access  Private
router.get('/:id', protect, employeeController.getEmployeeById);

// @route   POST /api/employees
// @desc    Criar um novo funcionário
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('nome', 'Nome é obrigatório').not().isEmpty(),
      check('email', 'Email válido é obrigatório').isEmail(),
      check('cpf', 'CPF é obrigatório').not().isEmpty(),
      check('dataNascimento', 'Data de nascimento é obrigatória').not().isEmpty(),
      check('departamento', 'Departamento é obrigatório').not().isEmpty(),
      check('cargo', 'Cargo é obrigatório').not().isEmpty(),
      check('dataContratacao', 'Data de contratação é obrigatória').not().isEmpty(),
      check('salario', 'Salário é obrigatório').isNumeric(),
      check('cargaHoraria', 'Carga horária é obrigatória').isNumeric()
    ]
  ],
  employeeController.createEmployee
);

// @route   PUT /api/employees/:id
// @desc    Atualizar funcionário
// @access  Private
router.put('/:id', protect, employeeController.updateEmployee);

// @route   DELETE /api/employees/:id
// @desc    Deletar funcionário
// @access  Private
router.delete('/:id', protect, employeeController.deleteEmployee);

// @route   GET /api/employees/stats
// @desc    Obter estatísticas de funcionários
// @access  Private
router.get('/stats', protect, employeeController.getEmployeeStats);

module.exports = router;
