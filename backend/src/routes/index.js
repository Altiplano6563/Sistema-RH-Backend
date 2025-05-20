const express = require('express');
const router = express.Router();

// Importar rotas específicas
const authRoutes = require('./auth.routes');
const employeeRoutes = require('./employee.routes');
const departmentRoutes = require('./department.routes');
const positionRoutes = require('./position.routes');
const movementRoutes = require('./movement.routes');
const dashboardRoutes = require('./dashboard.routes');

// Definir rotas principais
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionRoutes);
router.use('/movements', movementRoutes);
router.use('/dashboard', dashboardRoutes);

// Rota de verificação de saúde da API
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API funcionando corretamente',
    timestamp: new Date(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

module.exports = router;
