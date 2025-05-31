const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const positionController = require('../controllers/positionController');

// @route   GET api/positions
// @desc    Obter todos os cargos
// @access  Private
router.get('/', auth, positionController.getAllPositions);

// @route   GET api/positions/:id
// @desc    Obter cargo por ID
// @access  Private
router.get('/:id', auth, positionController.getPositionById);

// @route   POST api/positions
// @desc    Criar um novo cargo
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('titulo', 'Título é obrigatório').not().isEmpty(),
      check('departamento', 'Departamento é obrigatório').not().isEmpty()
    ]
  ],
  positionController.createPosition
);

// @route   PUT api/positions/:id
// @desc    Atualizar cargo
// @access  Private
router.put('/:id', auth, positionController.updatePosition);

// @route   DELETE api/positions/:id
// @desc    Deletar cargo
// @access  Private
router.delete('/:id', auth, positionController.deletePosition);

module.exports = router;
