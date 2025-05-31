const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET /api/dashboard/stats
// @desc    Obter estatísticas gerais do dashboard
// @access  Private
router.get('/stats', protect, dashboardController.getStats);

// @route   GET /api/dashboard/department-distribution
// @desc    Obter distribuição por departamento
// @access  Private
router.get('/department-distribution', protect, dashboardController.getDepartmentDistribution);

// @route   GET /api/dashboard/position-distribution
// @desc    Obter distribuição por cargo
// @access  Private
router.get('/position-distribution', protect, dashboardController.getPositionDistribution);

// @route   GET /api/dashboard/workmode-distribution
// @desc    Obter distribuição por modalidade de trabalho
// @access  Private
router.get('/workmode-distribution', protect, dashboardController.getWorkModeDistribution);

// @route   GET /api/dashboard/workload-distribution
// @desc    Obter distribuição por carga horária
// @access  Private
router.get('/workload-distribution', protect, dashboardController.getWorkloadDistribution);

// @route   GET /api/dashboard/movement-history
// @desc    Obter histórico de movimentações
// @access  Private
router.get('/movement-history', protect, dashboardController.getMovementHistory);

// @route   GET /api/dashboard/salary-analysis
// @desc    Obter análise salarial
// @access  Private
router.get('/salary-analysis', protect, dashboardController.getSalaryAnalysis);

// @route   GET /api/dashboard/budget-comparison
// @desc    Obter comparativo de orçamento
// @access  Private
router.get('/budget-comparison', protect, dashboardController.getBudgetComparison);

module.exports = router;
