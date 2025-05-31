const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const departmentController = require('../controllers/departmentController');

// @route   GET api/departments
// @desc    Obter todos os departamentos
// @access  Private
router.get('/', auth, departmentController.getAllDepartments);

// @route   GET api/departments/:id
// @desc    Obter departamento por ID
// @access  Private
router.get('/:id', auth, departmentController.getDepartmentById);

// @route   POST api/departments
// @desc    Criar um novo departamento
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('nome', 'Nome é obrigatório').not().isEmpty(),
      check('centroCusto', 'Centro de custo é obrigatório').not().isEmpty()
    ]
  ],
  departmentController.createDepartment
);

// @route   PUT api/departments/:id
// @desc    Atualizar departamento
// @access  Private
router.put('/:id', auth, departmentController.updateDepartment);

// @route   DELETE api/departments/:id
// @desc    Deletar departamento
// @access  Private
router.delete('/:id', auth, departmentController.deleteDepartment);

module.exports = router;
