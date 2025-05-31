const express = require('express');
const { check } = require('express-validator');
const { 
  getSalaryTables, 
  getSalaryTable, 
  createSalaryTable, 
  updateSalaryTable, 
  deleteSalaryTable,
  checkSalaries
} = require('../controllers/salaryTableController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rota para verificar salários fora da tabela
router.get('/check-salaries', authorize('Admin', 'Diretor', 'BusinessPartner'), checkSalaries);

// Rotas para tabelas salariais
router.route('/')
  .get(getSalaryTables)
  .post([
    check('cargo', 'Cargo é obrigatório').not().isEmpty(),
    check('nivel', 'Nível é obrigatório').not().isEmpty(),
    check('valorMinimo', 'Valor mínimo é obrigatório').isNumeric(),
    check('valorMedio', 'Valor médio é obrigatório').isNumeric(),
    check('valorMaximo', 'Valor máximo é obrigatório').isNumeric()
  ], authorize('Admin', 'Diretor'), createSalaryTable);

router.route('/:id')
  .get(getSalaryTable)
  .put(authorize('Admin', 'Diretor'), updateSalaryTable)
  .delete(authorize('Admin'), deleteSalaryTable);

module.exports = router;
