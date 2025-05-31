const express = require('express');
const { check } = require('express-validator');
const { 
  getMovements, 
  getMovement, 
  createMovement, 
  updateMovement, 
  deleteMovement 
} = require('../controllers/movementController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rotas para movimentações
router.route('/')
  .get(getMovements)
  .post([
    check('funcionario', 'Funcionário é obrigatório').not().isEmpty(),
    check('tipo', 'Tipo de movimentação é obrigatório').not().isEmpty(),
    check('justificativa', 'Justificativa é obrigatória').not().isEmpty(),
    check('dataEfetivacao', 'Data de efetivação é obrigatória').not().isEmpty()
  ], authorize('Admin', 'Diretor', 'Gestor'), createMovement);

router.route('/:id')
  .get(getMovement)
  .put(authorize('Admin', 'Diretor'), updateMovement)
  .delete(authorize('Admin'), deleteMovement);

module.exports = router;
