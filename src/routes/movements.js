const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const movementController = require('../controllers/movementController');

// @route   GET api/movements
// @desc    Obter todas as movimentações
// @access  Private
router.get('/', auth, movementController.getAllMovements);

// @route   GET api/movements/:id
// @desc    Obter movimentação por ID
// @access  Private
router.get('/:id', auth, movementController.getMovementById);

// @route   POST api/movements
// @desc    Criar uma nova movimentação
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('funcionario', 'Funcionário é obrigatório').not().isEmpty(),
      check('tipo', 'Tipo de movimentação é obrigatório').not().isEmpty(),
      check('dataEfetivacao', 'Data de efetivação é obrigatória').not().isEmpty()
    ]
  ],
  movementController.createMovement
);

// @route   PUT api/movements/:id
// @desc    Atualizar movimentação
// @access  Private
router.put('/:id', auth, movementController.updateMovement);

// @route   DELETE api/movements/:id
// @desc    Deletar movimentação
// @access  Private
router.delete('/:id', auth, movementController.deleteMovement);

module.exports = router;
