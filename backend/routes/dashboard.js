const express = require('express');
const { check } = require('express-validator');
const { 
  getDashboardMetrics, 
  createDashboardMetric, 
  updateDashboardMetric, 
  deleteDashboardMetric,
  getDashboardSummary
} = require('../controllers/dashboardController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Proteger todas as rotas
router.use(protect);

// Rota para resumo do dashboard
router.get('/summary', getDashboardSummary);

// Rotas para métricas do dashboard
router.route('/metrics')
  .get(getDashboardMetrics)
  .post([
    check('tipo', 'Tipo de métrica é obrigatório').not().isEmpty(),
    check('valor', 'Valor é obrigatório').isNumeric(),
    check('periodo', 'Período é obrigatório').not().isEmpty()
  ], authorize('Admin', 'Diretor', 'BusinessPartner'), createDashboardMetric);

router.route('/metrics/:id')
  .put(authorize('Admin', 'Diretor', 'BusinessPartner'), updateDashboardMetric)
  .delete(authorize('Admin', 'Diretor'), deleteDashboardMetric);

module.exports = router;
