const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const positionController = require('../controllers/positionController');

// @route   GET /api/positions
// @desc    Obter todos os cargos
// @access  Private
router.get('/', protect, positionController.getAllPositions);

// @route   GET /api/positions/:id
// @desc    Obter cargo por ID
// @access  Private
router.get('/:id', protect, positionController.getPositionById);

// @route   POST /api/positions
// @desc    Criar um novo cargo
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('titulo', 'Título é obrigatório').not().isEmpty(),
      check('departamento', 'Departamento é obrigatório').not().isEmpty(),
      check('faixaSalarial.minimo', 'Valor mínimo da faixa salarial é obrigatório').isNumeric(),
      check('faixaSalarial.maximo', 'Valor máximo da faixa salarial é obrigatório').isNumeric(),
      check('nivel', 'Nível é obrigatório').not().isEmpty()
    ]
  ],
  positionController.createPosition
);

// @route   PUT /api/positions/:id
// @desc    Atualizar cargo
// @access  Private
router.put('/:id', protect, positionController.updatePosition);

// @route   DELETE /api/positions/:id
// @desc    Deletar cargo
// @access  Private
router.delete('/:id', protect, positionController.deletePosition);

module.exports = router;
