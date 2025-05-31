const express = require('express');
const { check } = require('express-validator');
const { 
  getEmployees, 
  getEmployee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} = require('../controllers/employeeController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rotas para funcionários
router.route('/')
  .get(getEmployees)
  .post([
    check('nome', 'Nome é obrigatório').not().isEmpty(),
    check('email', 'Email válido é obrigatório').isEmail(),
    check('cpf', 'CPF é obrigatório').not().isEmpty(),
    check('dataNascimento', 'Data de nascimento é obrigatória').not().isEmpty(),
    check('departamento', 'Departamento é obrigatório').not().isEmpty(),
    check('cargo', 'Cargo é obrigatório').not().isEmpty(),
    check('dataContratacao', 'Data de contratação é obrigatória').not().isEmpty(),
    check('salario', 'Salário é obrigatório').not().isEmpty(),
    check('cargaHoraria', 'Carga horária é obrigatória').not().isEmpty()
  ], authorize('Admin', 'Gestor', 'BusinessPartner'), createEmployee);

router.route('/:id')
  .get(getEmployee)
  .put(authorize('Admin', 'Gestor', 'BusinessPartner'), updateEmployee)
  .delete(authorize('Admin'), deleteEmployee);

module.exports = router;
