const express = require('express');
const { check } = require('express-validator');
const { 
  getDepartments, 
  getDepartment, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} = require('../controllers/departmentController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rotas para departamentos
router.route('/')
  .get(getDepartments)
  .post([
    check('nome', 'Nome é obrigatório').not().isEmpty(),
    check('centroCusto', 'Centro de custo é obrigatório').not().isEmpty(),
    check('orcamento', 'Orçamento é obrigatório').isNumeric()
  ], authorize('Admin', 'Diretor'), createDepartment);

router.route('/:id')
  .get(getDepartment)
  .put(authorize('Admin', 'Diretor'), updateDepartment)
  .delete(authorize('Admin'), deleteDepartment);

module.exports = router;
