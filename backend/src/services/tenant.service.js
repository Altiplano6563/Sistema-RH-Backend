// Implementação do serviço de multitenancy para isolamento de dados entre empresas
const { Tenant, User } = require('../models');
const logger = require('../utils/logger');

class TenantService {
  /**
   * Obtém um tenant pelo ID
   * @param {string} id - ID do tenant
   * @returns {Object} - Dados do tenant
   */
  async getTenantById(id) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        throw new Error('Empresa não encontrada');
      }
      
      return tenant;
    } catch (error) {
      logger.error('Erro ao buscar tenant', { error: error.message, tenantId: id });
      throw error;
    }
  }

  /**
   * Lista todos os tenants (apenas para super admin)
   * @param {Object} filters - Filtros de busca
   * @param {number} page - Página atual
   * @param {number} limit - Limite de itens por página
   * @returns {Object} - Lista paginada de tenants
   */
  async listTenants(filters = {}, page = 1, limit = 10) {
    try {
      const offset = (page - 1) * limit;
      
      // Construir cláusula where com base nos filtros
      const whereClause = {};
      
      if (filters.nome) {
        whereClause.nome = { [Op.iLike]: `%${filters.nome}%` };
      }
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.plano) {
        whereClause.plano = filters.plano;
      }
      
      // Buscar tenants com paginação
      const { count, rows } = await Tenant.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['dataCriacao', 'DESC']],
        attributes: { exclude: ['deletedAt'] }
      });
      
      return {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        data: rows
      };
    } catch (error) {
      logger.error('Erro ao listar tenants', { error: error.message });
      throw error;
    }
  }

  /**
   * Cria um novo tenant
   * @param {Object} data - Dados do tenant
   * @returns {Object} - Tenant criado
   */
  async createTenant(data) {
    try {
      // Verificar se já existe tenant com o mesmo CNPJ
      const existingTenant = await Tenant.findOne({
        where: { cnpj: data.cnpj }
      });
      
      if (existingTenant) {
        throw new Error('Já existe uma empresa cadastrada com este CNPJ');
      }
      
      // Criar tenant
      const tenant = await Tenant.create({
        nome: data.nome,
        cnpj: data.cnpj,
        plano: data.plano || 'basic',
        status: data.status || 'trial',
        dataExpiracao: data.dataExpiracao || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias de trial
        configuracoes: data.configuracoes || {}
      });
      
      logger.info('Novo tenant criado', { tenantId: tenant.id, nome: tenant.nome });
      
      return tenant;
    } catch (error) {
      logger.error('Erro ao criar tenant', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Atualiza um tenant existente
   * @param {string} id - ID do tenant
   * @param {Object} data - Dados para atualização
   * @returns {Object} - Tenant atualizado
   */
  async updateTenant(id, data) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        throw new Error('Empresa não encontrada');
      }
      
      // Verificar se está tentando alterar o CNPJ para um já existente
      if (data.cnpj && data.cnpj !== tenant.cnpj) {
        const existingTenant = await Tenant.findOne({
          where: { cnpj: data.cnpj }
        });
        
        if (existingTenant) {
          throw new Error('Já existe uma empresa cadastrada com este CNPJ');
        }
      }
      
      // Atualizar tenant
      await tenant.update(data);
      
      logger.info('Tenant atualizado', { tenantId: tenant.id });
      
      return tenant;
    } catch (error) {
      logger.error('Erro ao atualizar tenant', { error: error.message, tenantId: id });
      throw error;
    }
  }

  /**
   * Desativa um tenant
   * @param {string} id - ID do tenant
   * @returns {boolean} - Sucesso da operação
   */
  async deactivateTenant(id) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        throw new Error('Empresa não encontrada');
      }
      
      // Desativar tenant
      await tenant.update({ status: 'inativo' });
      
      logger.info('Tenant desativado', { tenantId: tenant.id });
      
      return true;
    } catch (error) {
      logger.error('Erro ao desativar tenant', { error: error.message, tenantId: id });
      throw error;
    }
  }

  /**
   * Ativa um tenant
   * @param {string} id - ID do tenant
   * @returns {boolean} - Sucesso da operação
   */
  async activateTenant(id) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        throw new Error('Empresa não encontrada');
      }
      
      // Ativar tenant
      await tenant.update({ status: 'ativo' });
      
      logger.info('Tenant ativado', { tenantId: tenant.id });
      
      return true;
    } catch (error) {
      logger.error('Erro ao ativar tenant', { error: error.message, tenantId: id });
      throw error;
    }
  }

  /**
   * Atualiza o plano de um tenant
   * @param {string} id - ID do tenant
   * @param {string} plano - Novo plano
   * @param {Date} dataExpiracao - Nova data de expiração
   * @returns {Object} - Tenant atualizado
   */
  async updateTenantPlan(id, plano, dataExpiracao) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        throw new Error('Empresa não encontrada');
      }
      
      // Atualizar plano
      await tenant.update({
        plano,
        dataExpiracao: dataExpiracao || null
      });
      
      logger.info('Plano do tenant atualizado', { tenantId: tenant.id, plano });
      
      return tenant;
    } catch (error) {
      logger.error('Erro ao atualizar plano do tenant', { error: error.message, tenantId: id });
      throw error;
    }
  }

  /**
   * Obtém estatísticas de um tenant
   * @param {string} id - ID do tenant
   * @returns {Object} - Estatísticas do tenant
   */
  async getTenantStats(id) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        throw new Error('Empresa não encontrada');
      }
      
      // Contar usuários
      const userCount = await User.count({
        where: { tenantId: id }
      });
      
      // Contar colaboradores
      const { Employee } = require('../models');
      const employeeCount = await Employee.count({
        where: { tenantId: id }
      });
      
      // Contar departamentos
      const { Department } = require('../models');
      const departmentCount = await Department.count({
        where: { tenantId: id }
      });
      
      // Contar cargos
      const { Position } = require('../models');
      const positionCount = await Position.count({
        where: { tenantId: id }
      });
      
      // Contar movimentações
      const { Movement } = require('../models');
      const movementCount = await Movement.count({
        where: { tenantId: id }
      });
      
      return {
        tenant: {
          id: tenant.id,
          nome: tenant.nome,
          plano: tenant.plano,
          status: tenant.status,
          dataExpiracao: tenant.dataExpiracao,
          dataCriacao: tenant.dataCriacao
        },
        stats: {
          usuarios: userCount,
          colaboradores: employeeCount,
          departamentos: departmentCount,
          cargos: positionCount,
          movimentacoes: movementCount
        }
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do tenant', { error: error.message, tenantId: id });
      throw error;
    }
  }

  /**
   * Verifica se um tenant está ativo
   * @param {string} id - ID do tenant
   * @returns {boolean} - Status do tenant
   */
  async isTenantActive(id) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant) {
        return false;
      }
      
      return ['ativo', 'trial'].includes(tenant.status);
    } catch (error) {
      logger.error('Erro ao verificar status do tenant', { error: error.message, tenantId: id });
      return false;
    }
  }

  /**
   * Verifica se um tenant está expirado
   * @param {string} id - ID do tenant
   * @returns {boolean} - Status de expiração
   */
  async isTenantExpired(id) {
    try {
      const tenant = await Tenant.findByPk(id);
      
      if (!tenant || !tenant.dataExpiracao) {
        return false;
      }
      
      return new Date() > new Date(tenant.dataExpiracao);
    } catch (error) {
      logger.error('Erro ao verificar expiração do tenant', { error: error.message, tenantId: id });
      return false;
    }
  }
}

module.exports = new TenantService();
