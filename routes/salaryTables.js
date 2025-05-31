const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const salaryTableController = require('../controllers/salaryTableController');

// @route   GET /api/salary-tables
// @desc    Obter todas as tabelas salariais
// @access  Private
router.get('/', protect, salaryTableController.getAllSalaryTables);

// @route   GET /api/salary-tables/:id
// @desc    Obter tabela salarial por ID
// @access  Private
router.get('/:id', protect, salaryTableController.getSalaryTableById);

// @route   POST /api/salary-tables
// @desc    Criar uma nova tabela salarial
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('cargo', 'Cargo é obrigatório').not().isEmpty(),
      check('nivel', 'Nível é obrigatório').not().isEmpty(),
      check('valorMinimo', 'Valor mínimo é obrigatório').isNumeric(),
      check('valorMaximo', 'Valor máximo é obrigatório').isNumeric()
    ]
  ],
  salaryTableController.createSalaryTable
);

// @route   PUT /api/salary-tables/:id
// @desc    Atualizar tabela salarial
// @access  Private
router.put('/:id', protect, salaryTableController.updateSalaryTable);

// @route   DELETE /api/salary-tables/:id
// @desc    Deletar tabela salarial
// @access  Private
router.delete('/:id', protect, salaryTableController.deleteSalaryTable);

module.exports = router;
