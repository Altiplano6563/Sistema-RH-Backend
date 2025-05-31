const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const movementController = require('../controllers/movementController');

// @route   GET /api/movements
// @desc    Obter todas as movimentações
// @access  Private
router.get('/', protect, movementController.getAllMovements);

// @route   GET /api/movements/:id
// @desc    Obter movimentação por ID
// @access  Private
router.get('/:id', protect, movementController.getMovementById);

// @route   POST /api/movements
// @desc    Criar uma nova movimentação
// @access  Private
router.post(
  '/',
  [
    protect,
    [
      check('funcionario', 'Funcionário é obrigatório').not().isEmpty(),
      check('tipo', 'Tipo de movimentação é obrigatório').not().isEmpty(),
      check('justificativa', 'Justificativa é obrigatória').not().isEmpty(),
      check('dataEfetivacao', 'Data de efetivação é obrigatória').not().isEmpty()
    ]
  ],
  movementController.createMovement
);

// @route   PUT /api/movements/:id
// @desc    Atualizar movimentação
// @access  Private
router.put('/:id', protect, movementController.updateMovement);

// @route   PUT /api/movements/:id/approve
// @desc    Aprovar movimentação
// @access  Private
router.put('/:id/approve', protect, movementController.approveMovement);

// @route   PUT /api/movements/:id/reject
// @desc    Rejeitar movimentação
// @access  Private
router.put(
  '/:id/reject',
  [
    protect,
    [
      check('motivoRejeicao', 'Motivo da rejeição é obrigatório').not().isEmpty()
    ]
  ],
  movementController.rejectMovement
);

// @route   DELETE /api/movements/:id
// @desc    Deletar movimentação
// @access  Private
router.delete('/:id', protect, movementController.deleteMovement);

module.exports = router;
