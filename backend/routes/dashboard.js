const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET api/dashboard/summary
// @desc    Obter resumo do dashboard
// @access  Private
router.get('/summary', auth, dashboardController.getDashboardSummary);

// @route   GET api/dashboard/headcount
// @desc    Obter dados de headcount
// @access  Private
router.get('/headcount', auth, dashboardController.getHeadcountData);

// @route   GET api/dashboard/turnover
// @desc    Obter dados de turnover
// @access  Private
router.get('/turnover', auth, dashboardController.getTurnoverData);

// @route   GET api/dashboard/budget
// @desc    Obter dados de orçamento
// @access  Private
router.get('/budget', auth, dashboardController.getBudgetData);

// @route   GET api/dashboard/salary-alerts
// @desc    Obter alertas de salário
// @access  Private
router.get('/salary-alerts', auth, dashboardController.getSalaryAlerts);

module.exports = router;
