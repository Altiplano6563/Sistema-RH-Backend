// Implementação do serviço de dashboard dinâmico
const { Employee, Department, Position, Movement } = require('../models');
const { Op, Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DashboardService {
  /**
   * Obtém estatísticas gerais do dashboard
   * @param {string} tenantId - ID do tenant
   * @returns {Object} - Estatísticas gerais
   */
  async getStats(tenantId) {
    try {
      // Contagem total de colaboradores
      const totalEmployees = await Employee.count({
        where: { 
          tenantId,
          status: 'ativo'
        }
      });
      
      // Contagem de colaboradores por gênero
      const genderDistribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'genero',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['genero'],
        raw: true
      });
      
      // Contagem de colaboradores por modalidade de trabalho
      const workModeDistribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'modalidadeTrabalho',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['modalidadeTrabalho'],
        raw: true
      });
      
      // Contagem de colaboradores por carga horária
      const workloadDistribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'cargaHoraria',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['cargaHoraria'],
        raw: true
      });
      
      // Média salarial
      const salaryAvg = await Employee.findOne({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('salario')), 'average']
        ],
        raw: true
      });
      
      // Contagem de movimentações recentes (últimos 30 dias)
      const recentMovements = await Movement.count({
        where: { 
          tenantId,
          dataEfetivacao: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });
      
      // Contagem de departamentos ativos
      const departmentsCount = await Department.count({
        where: { 
          tenantId,
          status: 'ativo'
        }
      });
      
      // Contagem de cargos ativos
      const positionsCount = await Position.count({
        where: { 
          tenantId,
          status: 'ativo'
        }
      });
      
      return {
        totalEmployees,
        genderDistribution,
        workModeDistribution,
        workloadDistribution,
        averageSalary: salaryAvg ? parseFloat(salaryAvg.average).toFixed(2) : 0,
        recentMovements,
        departmentsCount,
        positionsCount
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do dashboard', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém distribuição de colaboradores por departamento
   * @param {string} tenantId - ID do tenant
   * @returns {Array} - Distribuição por departamento
   */
  async getDepartmentDistribution(tenantId) {
    try {
      const distribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'departamentoId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [{
          model: Department,
          as: 'departamento',
          attributes: ['nome'],
          where: { status: 'ativo' }
        }],
        group: ['departamentoId', 'departamento.id', 'departamento.nome'],
        raw: true,
        nest: true
      });
      
      return distribution.map(item => ({
        departamentoId: item.departamentoId,
        nome: item.departamento.nome,
        count: parseInt(item.count)
      }));
    } catch (error) {
      logger.error('Erro ao obter distribuição por departamento', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém distribuição de colaboradores por cargo
   * @param {string} tenantId - ID do tenant
   * @returns {Array} - Distribuição por cargo
   */
  async getPositionDistribution(tenantId) {
    try {
      const distribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'cargoId',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [{
          model: Position,
          as: 'cargo',
          attributes: ['nome', 'nivel'],
          where: { status: 'ativo' }
        }],
        group: ['cargoId', 'cargo.id', 'cargo.nome', 'cargo.nivel'],
        raw: true,
        nest: true
      });
      
      return distribution.map(item => ({
        cargoId: item.cargoId,
        nome: item.cargo.nome,
        nivel: item.cargo.nivel,
        count: parseInt(item.count)
      }));
    } catch (error) {
      logger.error('Erro ao obter distribuição por cargo', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém distribuição de colaboradores por modalidade de trabalho
   * @param {string} tenantId - ID do tenant
   * @returns {Array} - Distribuição por modalidade
   */
  async getWorkModeDistribution(tenantId) {
    try {
      const distribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'modalidadeTrabalho',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['modalidadeTrabalho'],
        raw: true
      });
      
      // Mapear para nomes mais amigáveis
      const modeLabels = {
        'presencial': 'Presencial',
        'hibrido': 'Híbrido',
        'remoto': 'Remoto'
      };
      
      return distribution.map(item => ({
        modalidade: item.modalidadeTrabalho,
        nome: modeLabels[item.modalidadeTrabalho] || item.modalidadeTrabalho,
        count: parseInt(item.count)
      }));
    } catch (error) {
      logger.error('Erro ao obter distribuição por modalidade', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém distribuição de colaboradores por carga horária
   * @param {string} tenantId - ID do tenant
   * @returns {Array} - Distribuição por carga horária
   */
  async getWorkloadDistribution(tenantId) {
    try {
      const distribution = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'cargaHoraria',
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        group: ['cargaHoraria'],
        order: [['cargaHoraria', 'ASC']],
        raw: true
      });
      
      return distribution.map(item => ({
        cargaHoraria: item.cargaHoraria,
        nome: `${item.cargaHoraria}h`,
        count: parseInt(item.count)
      }));
    } catch (error) {
      logger.error('Erro ao obter distribuição por carga horária', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém histórico de movimentações
   * @param {string} tenantId - ID do tenant
   * @param {number} meses - Número de meses para análise
   * @returns {Object} - Histórico de movimentações
   */
  async getMovementHistory(tenantId, meses = 12) {
    try {
      // Data inicial para filtro (X meses atrás)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - meses);
      
      // Buscar movimentações no período
      const movements = await Movement.findAll({
        where: { 
          tenantId,
          dataEfetivacao: {
            [Op.gte]: startDate
          }
        },
        attributes: [
          'tipo',
          'dataEfetivacao',
          'status'
        ],
        order: [['dataEfetivacao', 'ASC']],
        raw: true
      });
      
      // Agrupar por mês e tipo
      const monthlyData = {};
      const tipoLabels = {
        'promocao': 'Promoção',
        'transferencia': 'Transferência',
        'merito': 'Mérito',
        'equiparacao': 'Equiparação',
        'modalidade': 'Mudança de Modalidade',
        'cargaHoraria': 'Mudança de Carga Horária'
      };
      
      movements.forEach(movement => {
        // Apenas movimentações aprovadas
        if (movement.status !== 'aprovado') return;
        
        // Formatar data como YYYY-MM
        const date = new Date(movement.dataEfetivacao);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear()}`;
        
        // Inicializar mês se não existir
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            label: monthLabel,
            promocao: 0,
            transferencia: 0,
            merito: 0,
            equiparacao: 0,
            modalidade: 0,
            cargaHoraria: 0,
            total: 0
          };
        }
        
        // Incrementar contagem do tipo
        monthlyData[monthKey][movement.tipo]++;
        monthlyData[monthKey].total++;
      });
      
      // Converter para array e ordenar por data
      const result = Object.keys(monthlyData)
        .sort()
        .map(key => ({
          month: key,
          label: monthlyData[key].label,
          data: {
            promocao: monthlyData[key].promocao,
            transferencia: monthlyData[key].transferencia,
            merito: monthlyData[key].merito,
            equiparacao: monthlyData[key].equiparacao,
            modalidade: monthlyData[key].modalidade,
            cargaHoraria: monthlyData[key].cargaHoraria,
            total: monthlyData[key].total
          }
        }));
      
      return {
        labels: tipoLabels,
        data: result
      };
    } catch (error) {
      logger.error('Erro ao obter histórico de movimentações', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém análise salarial por departamento e cargo
   * @param {string} tenantId - ID do tenant
   * @returns {Object} - Análise salarial
   */
  async getSalaryAnalysis(tenantId) {
    try {
      // Análise por departamento
      const departmentAnalysis = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'departamentoId',
          [Sequelize.fn('MIN', Sequelize.col('salario')), 'min'],
          [Sequelize.fn('MAX', Sequelize.col('salario')), 'max'],
          [Sequelize.fn('AVG', Sequelize.col('salario')), 'avg'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [{
          model: Department,
          as: 'departamento',
          attributes: ['nome'],
          where: { status: 'ativo' }
        }],
        group: ['departamentoId', 'departamento.id', 'departamento.nome'],
        raw: true,
        nest: true
      });
      
      // Análise por cargo
      const positionAnalysis = await Employee.findAll({
        where: { 
          tenantId,
          status: 'ativo'
        },
        attributes: [
          'cargoId',
          [Sequelize.fn('MIN', Sequelize.col('salario')), 'min'],
          [Sequelize.fn('MAX', Sequelize.col('salario')), 'max'],
          [Sequelize.fn('AVG', Sequelize.col('salario')), 'avg'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ],
        include: [{
          model: Position,
          as: 'cargo',
          attributes: ['nome', 'nivel', 'faixaSalarialMin', 'faixaSalarialMax'],
          where: { status: 'ativo' }
        }],
        group: ['cargoId', 'cargo.id', 'cargo.nome', 'cargo.nivel', 'cargo.faixaSalarialMin', 'cargo.faixaSalarialMax'],
        raw: true,
        nest: true
      });
      
      // Formatar resultados
      const byDepartment = departmentAnalysis.map(item => ({
        departamentoId: item.departamentoId,
        nome: item.departamento.nome,
        minSalario: parseFloat(item.min).toFixed(2),
        maxSalario: parseFloat(item.max).toFixed(2),
        mediaSalario: parseFloat(item.avg).toFixed(2),
        totalColaboradores: parseInt(item.count)
      }));
      
      const byPosition = positionAnalysis.map(item => ({
        cargoId: item.cargoId,
        nome: item.cargo.nome,
        nivel: item.cargo.nivel,
        minSalario: parseFloat(item.min).toFixed(2),
        maxSalario: parseFloat(item.max).toFixed(2),
        mediaSalario: parseFloat(item.avg).toFixed(2),
        faixaMin: item.cargo.faixaSalarialMin ? parseFloat(item.cargo.faixaSalarialMin).toFixed(2) : null,
        faixaMax: item.cargo.faixaSalarialMax ? parseFloat(item.cargo.faixaSalarialMax).toFixed(2) : null,
        totalColaboradores: parseInt(item.count),
        // Identificar colaboradores fora da faixa salarial
        foraDaFaixa: item.cargo.faixaSalarialMin && item.cargo.faixaSalarialMax ? 
          (parseFloat(item.min) < parseFloat(item.cargo.faixaSalarialMin) || 
           parseFloat(item.max) > parseFloat(item.cargo.faixaSalarialMax)) : false
      }));
      
      return {
        byDepartment,
        byPosition
      };
    } catch (error) {
      logger.error('Erro ao obter análise salarial', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém dados para o dashboard de turnover
   * @param {string} tenantId - ID do tenant
   * @param {number} ano - Ano para análise
   * @returns {Object} - Dados de turnover
   */
  async getTurnoverData(tenantId, ano = new Date().getFullYear()) {
    try {
      // Definir período de análise
      const startDate = new Date(ano, 0, 1); // 1º de janeiro do ano
      const endDate = new Date(ano, 11, 31); // 31 de dezembro do ano
      
      // Buscar admissões no período
      const admissions = await Employee.count({
        where: { 
          tenantId,
          dataAdmissao: {
            [Op.between]: [startDate, endDate]
          }
        }
      });
      
      // Buscar demissões no período
      const terminations = await Employee.count({
        where: { 
          tenantId,
          dataDemissao: {
            [Op.between]: [startDate, endDate]
          }
        }
      });
      
      // Buscar headcount médio no período
      const headcountByMonth = [];
      
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(ano, month, 1);
        const monthEnd = new Date(ano, month + 1, 0);
        
        // Contar colaboradores ativos no final do mês
        const activeCount = await Employee.count({
          where: { 
            tenantId,
            dataAdmissao: {
              [Op.lte]: monthEnd
            },
            [Op.or]: [
              { dataDemissao: null },
              { dataDemissao: { [Op.gt]: monthEnd } }
            ]
          }
        });
        
        headcountByMonth.push({
          month: month + 1,
          label: new Date(ano, month, 1).toLocaleString('pt-BR', { month: 'short' }),
          count: activeCount
        });
      }
      
      // Calcular headcount médio
      const averageHeadcount = headcountByMonth.reduce((sum, month) => sum + month.count, 0) / 12;
      
      // Calcular turnover
      const turnoverRate = averageHeadcount > 0 ? 
        ((admissions + terminations) / 2 / averageHeadcount) * 100 : 0;
      
      return {
        year: ano,
        admissions,
        terminations,
        averageHeadcount: Math.round(averageHeadcount),
        turnoverRate: turnoverRate.toFixed(2),
        headcountByMonth
      };
    } catch (error) {
      logger.error('Erro ao obter dados de turnover', { error: error.message, tenantId });
      throw error;
    }
  }

  /**
   * Obtém resumo do dashboard
   * @param {string} tenantId - ID do tenant
   * @returns {Object} - Resumo do dashboard
   */
  async getDashboardSummary(tenantId) {
    try {
      // Obter estatísticas gerais
      const stats = await this.getStats(tenantId);
      
      // Obter distribuição por departamento (top 5)
      const departmentDistribution = await this.getDepartmentDistribution(tenantId);
      const topDepartments = departmentDistribution
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Obter distribuição por modalidade
      const workModeDistribution = await this.getWorkModeDistribution(tenantId);
      
      // Obter dados de turnover para o ano atual
      const turnoverData = await this.getTurnoverData(tenantId);
      
      // Obter movimentações recentes (últimos 3 meses)
      const recentMovements = await this.getMovementHistory(tenantId, 3);
      
      return {
        stats,
        topDepartments,
        workModeDistribution,
        turnover: {
          rate: turnoverData.turnoverRate,
          admissions: turnoverData.admissions,
          terminations: turnoverData.terminations
        },
        recentMovements: recentMovements.data.slice(-3)
      };
    } catch (error) {
      logger.error('Erro ao obter resumo do dashboard', { error: error.message, tenantId });
      throw error;
    }
  }
}

module.exports = new DashboardService();
