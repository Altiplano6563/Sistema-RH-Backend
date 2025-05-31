const express = require('express');
const { check } = require('express-validator');
const { 
  getPositions, 
  getPosition, 
  createPosition, 
  updatePosition, 
  deletePosition 
} = require('../controllers/positionController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rotas para cargos
router.route('/')
  .get(getPositions)
  .post([
    check('titulo', 'Título é obrigatório').not().isEmpty(),
    check('departamento', 'Departamento é obrigatório').not().isEmpty(),
    check('faixaSalarialMinima', 'Faixa salarial mínima é obrigatória').isNumeric(),
    check('faixaSalarialMaxima', 'Faixa salarial máxima é obrigatória').isNumeric()
  ], authorize('Admin', 'Diretor'), createPosition);

router.route('/:id')
  .get(getPosition)
  .put(authorize('Admin', 'Diretor'), updatePosition)
  .delete(authorize('Admin'), deletePosition);

module.exports = router;
