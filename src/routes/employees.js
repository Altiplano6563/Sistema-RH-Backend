const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// @route   GET api/employees
// @desc    Obter todos os funcionários
// @access  Private
router.get('/', auth, employeeController.getAllEmployees);

// @route   GET api/employees/:id
// @desc    Obter funcionário por ID
// @access  Private
router.get('/:id', auth, employeeController.getEmployeeById);

// @route   POST api/employees
// @desc    Criar um novo funcionário
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('nome', 'Nome é obrigatório').not().isEmpty(),
      check('email', 'Email válido é obrigatório').isEmail(),
      check('departamento', 'Departamento é obrigatório').not().isEmpty(),
      check('cargo', 'Cargo é obrigatório').not().isEmpty()
    ]
  ],
  employeeController.createEmployee
);

// @route   PUT api/employees/:id
// @desc    Atualizar funcionário
// @access  Private
router.put('/:id', auth, employeeController.updateEmployee);

// @route   DELETE api/employees/:id
// @desc    Deletar funcionário
// @access  Private
router.delete('/:id', auth, employeeController.deleteEmployee);

module.exports = router;
