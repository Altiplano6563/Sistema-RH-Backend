const { Employee, Department, Position, Movement, Tenant } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Obter estatísticas gerais do dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Total de colaboradores
    const totalEmployees = await Employee.count({
      where: { 
        tenantId,
        status: 'ativo'
      }
    });
    
    // Total de departamentos
    const totalDepartments = await Department.count({
      where: { 
        tenantId,
        status: 'ativo'
      }
    });
    
    // Total de cargos
    const totalPositions = await Position.count({
      where: { 
        tenantId,
        status: 'ativo'
      }
    });
    
    // Movimentações recentes (últimos 30 dias)
    const recentMovements = await Movement.count({
      where: { 
        tenantId,
        dataEfetivacao: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // Retornar estatísticas
    return res.status(200).json({
      status: 'success',
      message: 'Estatísticas do dashboard obtidas com sucesso',
      data: {
        totalColaboradores: totalEmployees,
        totalDepartamentos: totalDepartments,
        totalCargos: totalPositions,
        movimentacoesRecentes: recentMovements
      }
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas do dashboard', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter estatísticas do dashboard' 
    });
  }
};

// Obter distribuição por departamento
exports.getDepartmentDistribution = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Buscar contagem de colaboradores por departamento
    const departmentDistribution = await Employee.findAll({
      attributes: [
        'departamentoId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { 
        tenantId,
        status: 'ativo'
      },
      include: [
        {
          model: Department,
          as: 'departamento',
          attributes: ['nome']
        }
      ],
      group: ['departamentoId', 'departamento.id', 'departamento.nome'],
      order: [[Sequelize.literal('total'), 'DESC']]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Distribuição por departamento obtida com sucesso',
      data: {
        distribuicaoDepartamento: departmentDistribution
      }
    });
  } catch (error) {
    logger.error('Erro ao obter distribuição por departamento', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter distribuição por departamento' 
    });
  }
};

// Obter distribuição por cargo
exports.getPositionDistribution = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Buscar contagem de colaboradores por cargo
    const positionDistribution = await Employee.findAll({
      attributes: [
        'cargoId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { 
        tenantId,
        status: 'ativo'
      },
      include: [
        {
          model: Position,
          as: 'cargo',
          attributes: ['nome', 'nivel']
        }
      ],
      group: ['cargoId', 'cargo.id', 'cargo.nome', 'cargo.nivel'],
      order: [[Sequelize.literal('total'), 'DESC']]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Distribuição por cargo obtida com sucesso',
      data: {
        distribuicaoCargo: positionDistribution
      }
    });
  } catch (error) {
    logger.error('Erro ao obter distribuição por cargo', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter distribuição por cargo' 
    });
  }
};

// Obter distribuição por modalidade de trabalho
exports.getWorkModeDistribution = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Buscar contagem de colaboradores por modalidade de trabalho
    const workModeDistribution = await Employee.findAll({
      attributes: [
        'modalidadeTrabalho',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { 
        tenantId,
        status: 'ativo'
      },
      group: ['modalidadeTrabalho'],
      order: [[Sequelize.literal('total'), 'DESC']]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Distribuição por modalidade de trabalho obtida com sucesso',
      data: {
        distribuicaoModalidade: workModeDistribution
      }
    });
  } catch (error) {
    logger.error('Erro ao obter distribuição por modalidade de trabalho', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter distribuição por modalidade de trabalho' 
    });
  }
};

// Obter distribuição por carga horária
exports.getWorkloadDistribution = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Buscar contagem de colaboradores por carga horária
    const workloadDistribution = await Employee.findAll({
      attributes: [
        'cargaHoraria',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { 
        tenantId,
        status: 'ativo'
      },
      group: ['cargaHoraria'],
      order: [['cargaHoraria', 'ASC']]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Distribuição por carga horária obtida com sucesso',
      data: {
        distribuicaoCargaHoraria: workloadDistribution
      }
    });
  } catch (error) {
    logger.error('Erro ao obter distribuição por carga horária', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter distribuição por carga horária' 
    });
  }
};

// Obter histórico de movimentações por tipo
exports.getMovementHistory = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { meses = 12 } = req.query;
    
    // Calcular data inicial (X meses atrás)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(meses));
    
    // Buscar movimentações agrupadas por mês e tipo
    const movementHistory = await Movement.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('dataEfetivacao')), 'mes'],
        'tipo',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { 
        tenantId,
        status: 'aprovado',
        dataEfetivacao: {
          [Op.gte]: startDate
        }
      },
      group: [Sequelize.fn('date_trunc', 'month', Sequelize.col('dataEfetivacao')), 'tipo'],
      order: [
        [Sequelize.fn('date_trunc', 'month', Sequelize.col('dataEfetivacao')), 'ASC'],
        ['tipo', 'ASC']
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Histórico de movimentações obtido com sucesso',
      data: {
        historicoMovimentacoes: movementHistory
      }
    });
  } catch (error) {
    logger.error('Erro ao obter histórico de movimentações', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter histórico de movimentações' 
    });
  }
};

// Obter dados para análise salarial
exports.getSalaryAnalysis = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    
    // Buscar estatísticas salariais por cargo
    const salaryAnalysis = await Employee.findAll({
      attributes: [
        'cargoId',
        [Sequelize.fn('MIN', Sequelize.col('salario')), 'minSalario'],
        [Sequelize.fn('MAX', Sequelize.col('salario')), 'maxSalario'],
        [Sequelize.fn('AVG', Sequelize.col('salario')), 'mediaSalario'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
      ],
      where: { 
        tenantId,
        status: 'ativo'
      },
      include: [
        {
          model: Position,
          as: 'cargo',
          attributes: ['nome', 'nivel', 'faixaSalarialMin', 'faixaSalarialMax']
        }
      ],
      group: ['cargoId', 'cargo.id', 'cargo.nome', 'cargo.nivel', 'cargo.faixaSalarialMin', 'cargo.faixaSalarialMax'],
      order: [['cargo', 'nome', 'ASC'], ['cargo', 'nivel', 'ASC']]
    });
    
    // Identificar colaboradores fora da faixa salarial
    const outOfRangeEmployees = await Employee.findAll({
      attributes: ['id', 'nome', 'salario'],
      where: { 
        tenantId,
        status: 'ativo'
      },
      include: [
        {
          model: Position,
          as: 'cargo',
          attributes: ['nome', 'nivel', 'faixaSalarialMin', 'faixaSalarialMax'],
          where: {
            [Op.or]: [
              {
                faixaSalarialMin: {
                  [Op.ne]: null
                },
                [Op.and]: [
                  Sequelize.literal('Employee.salario < cargo.faixaSalarialMin')
                ]
              },
              {
                faixaSalarialMax: {
                  [Op.ne]: null
                },
                [Op.and]: [
                  Sequelize.literal('Employee.salario > cargo.faixaSalarialMax')
                ]
              }
            ]
          }
        }
      ]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Análise salarial obtida com sucesso',
      data: {
        analiseSalarial: salaryAnalysis,
        colaboradoresForaFaixa: outOfRangeEmployees
      }
    });
  } catch (error) {
    logger.error('Erro ao obter análise salarial', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao obter análise salarial' 
    });
  }
};
