// Rotas de dashboard
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');

// Funções de controller simplificadas para teste
const getDashboardData = (req, res) => {
  res.json({
    status: 'success',
    message: 'Dados do dashboard',
    data: {
      summary: {
        totalEmployees: 150,
        departmentsCount: 8,
        positionsCount: 25,
        recentMovements: 12
      },
      departmentDistribution: [
        { nome: 'TI', count: 35 },
        { nome: 'RH', count: 15 },
        { nome: 'Financeiro', count: 20 },
        { nome: 'Marketing', count: 18 },
        { nome: 'Vendas', count: 30 },
        { nome: 'Operações', count: 22 },
        { nome: 'Administrativo', count: 10 }
      ],
      workModeDistribution: [
        { nome: 'Presencial', count: 60 },
        { nome: 'Híbrido', count: 65 },
        { nome: 'Remoto', count: 25 }
      ],
      workloadDistribution: [
        { nome: '150h', count: 15 },
        { nome: '180h', count: 35 },
        { nome: '200h', count: 40 },
        { nome: '220h', count: 60 }
      ],
      movementHistory: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        data: [
          { label: 'Jan', data: { promocao: 2, transferencia: 3, merito: 1, equiparacao: 0, total: 6 } },
          { label: 'Fev', data: { promocao: 1, transferencia: 2, merito: 2, equiparacao: 1, total: 6 } },
          { label: 'Mar', data: { promocao: 3, transferencia: 1, merito: 0, equiparacao: 2, total: 6 } },
          { label: 'Abr', data: { promocao: 2, transferencia: 4, merito: 3, equiparacao: 1, total: 10 } },
          { label: 'Mai', data: { promocao: 4, transferencia: 2, merito: 2, equiparacao: 0, total: 8 } },
          { label: 'Jun', data: { promocao: 1, transferencia: 3, merito: 1, equiparacao: 1, total: 6 } }
        ]
      },
      salaryAnalysis: {
        byDepartment: [
          { nome: 'TI', mediaSalario: 8500, minSalario: 4500, maxSalario: 15000 },
          { nome: 'RH', mediaSalario: 6200, minSalario: 3800, maxSalario: 12000 },
          { nome: 'Financeiro', mediaSalario: 7800, minSalario: 4200, maxSalario: 14000 },
          { nome: 'Marketing', mediaSalario: 6800, minSalario: 3500, maxSalario: 11000 },
          { nome: 'Vendas', mediaSalario: 7200, minSalario: 3200, maxSalario: 13000 },
          { nome: 'Operações', mediaSalario: 5500, minSalario: 3000, maxSalario: 9000 },
          { nome: 'Administrativo', mediaSalario: 5200, minSalario: 2800, maxSalario: 8500 }
        ]
      }
    }
  });
};

const getHeadcountReport = (req, res) => {
  res.json({
    status: 'success',
    message: 'Relatório de headcount',
    data: {
      total: 150,
      byDepartment: [
        { nome: 'TI', count: 35 },
        { nome: 'RH', count: 15 },
        { nome: 'Financeiro', count: 20 },
        { nome: 'Marketing', count: 18 },
        { nome: 'Vendas', count: 30 },
        { nome: 'Operações', count: 22 },
        { nome: 'Administrativo', count: 10 }
      ],
      byPosition: [
        { nome: 'Analista', count: 65 },
        { nome: 'Especialista', count: 35 },
        { nome: 'Coordenador', count: 20 },
        { nome: 'Gerente', count: 15 },
        { nome: 'Diretor', count: 5 },
        { nome: 'Estagiário', count: 10 }
      ]
    }
  });
};

const getTurnoverReport = (req, res) => {
  res.json({
    status: 'success',
    message: 'Relatório de turnover',
    data: {
      overall: 0.12,
      byDepartment: [
        { nome: 'TI', rate: 0.08 },
        { nome: 'RH', rate: 0.05 },
        { nome: 'Financeiro', rate: 0.07 },
        { nome: 'Marketing', rate: 0.15 },
        { nome: 'Vendas', rate: 0.18 },
        { nome: 'Operações', rate: 0.12 },
        { nome: 'Administrativo', rate: 0.09 }
      ],
      byPeriod: [
        { period: 'Jan', rate: 0.10 },
        { period: 'Fev', rate: 0.08 },
        { period: 'Mar', rate: 0.12 },
        { period: 'Abr', rate: 0.15 },
        { period: 'Mai', rate: 0.11 },
        { period: 'Jun', rate: 0.09 }
      ]
    }
  });
};

const getSalaryReport = (req, res) => {
  res.json({
    status: 'success',
    message: 'Relatório de salários',
    data: {
      averageSalary: 7200,
      byDepartment: [
        { nome: 'TI', mediaSalario: 8500, minSalario: 4500, maxSalario: 15000 },
        { nome: 'RH', mediaSalario: 6200, minSalario: 3800, maxSalario: 12000 },
        { nome: 'Financeiro', mediaSalario: 7800, minSalario: 4200, maxSalario: 14000 },
        { nome: 'Marketing', mediaSalario: 6800, minSalario: 3500, maxSalario: 11000 },
        { nome: 'Vendas', mediaSalario: 7200, minSalario: 3200, maxSalario: 13000 },
        { nome: 'Operações', mediaSalario: 5500, minSalario: 3000, maxSalario: 9000 },
        { nome: 'Administrativo', mediaSalario: 5200, minSalario: 2800, maxSalario: 8500 }
      ],
      byPosition: [
        { nome: 'Analista', mediaSalario: 5500 },
        { nome: 'Especialista', mediaSalario: 7800 },
        { nome: 'Coordenador', mediaSalario: 9500 },
        { nome: 'Gerente', mediaSalario: 12000 },
        { nome: 'Diretor', mediaSalario: 18000 },
        { nome: 'Estagiário', mediaSalario: 2000 }
      ]
    }
  });
};

const exportDashboardData = (req, res) => {
  res.json({
    status: 'success',
    message: 'Dados exportados com sucesso',
    data: {
      downloadUrl: 'https://exemplo.com/exports/dashboard-data.xlsx'
    }
  });
};

// Rotas
router.get('/', authMiddleware, getDashboardData);
router.get('/headcount', authMiddleware, getHeadcountReport);
router.get('/turnover', authMiddleware, getTurnoverReport);
router.get('/salary', authMiddleware, getSalaryReport);
router.post('/export', authMiddleware, exportDashboardData);

module.exports = router;
