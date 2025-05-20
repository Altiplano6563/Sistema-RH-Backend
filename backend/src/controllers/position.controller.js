const { Position, Department, Employee, Tenant } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Listar cargos
exports.getPositions = async (req, res) => {
  try {
    const { search, departamentoId, nivel, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Construir condições de busca
    const where = { tenantId: req.tenantId };
    
    if (search) {
      where.nome = { [Op.iLike]: `%${search}%` };
    }
    
    if (departamentoId) {
      where.departamentoId = departamentoId;
    }
    
    if (nivel) {
      where.nivel = nivel;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Buscar cargos com paginação
    const { count, rows } = await Position.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'departamento',
          attributes: ['id', 'nome']
        }
      ],
      order: [['nome', 'ASC']],
      limit,
      offset
    });
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(count / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return res.status(200).json({
      status: 'success',
      message: 'Cargos listados com sucesso',
      data: {
        cargos: rows,
        pagination: {
          total: count,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao listar cargos', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao listar cargos' 
    });
  }
};

// Obter cargo por ID
exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar cargo com detalhes
    const position = await Position.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      },
      include: [
        {
          model: Department,
          as: 'departamento',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!position) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Cargo não encontrado' 
      });
    }
    
    // Buscar colaboradores com este cargo
    const employees = await Employee.findAll({
      where: {
        cargoId: id,
        tenantId: req.tenantId
      },
      attributes: ['id', 'nome', 'email', 'status']
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Cargo encontrado com sucesso',
      data: {
        cargo: position,
        colaboradores: employees
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar cargo', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar cargo' 
    });
  }
};

// Criar novo cargo
exports.createPosition = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      nivel,
      departamentoId,
      faixaSalarialMin,
      faixaSalarialMax,
      status
    } = req.body;
    
    // Verificar se departamento existe
    const department = await Department.findOne({
      where: { 
        id: departamentoId,
        tenantId: req.tenantId
      }
    });
    
    if (!department) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Departamento não encontrado' 
      });
    }
    
    // Verificar se já existe cargo com este nome e nível no departamento
    const existingPosition = await Position.findOne({
      where: { 
        nome,
        nivel,
        departamentoId,
        tenantId: req.tenantId
      }
    });
    
    if (existingPosition) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Já existe um cargo com este nome e nível neste departamento' 
      });
    }
    
    // Criar novo cargo
    const position = await Position.create({
      tenantId: req.tenantId,
      nome,
      descricao,
      nivel,
      departamentoId,
      faixaSalarialMin,
      faixaSalarialMax,
      status: status || 'ativo'
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Cargo criado com sucesso',
      data: {
        cargo: position
      }
    });
  } catch (error) {
    logger.error('Erro ao criar cargo', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao criar cargo' 
    });
  }
};

// Atualizar cargo
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      nivel,
      departamentoId,
      faixaSalarialMin,
      faixaSalarialMax,
      status
    } = req.body;
    
    // Buscar cargo
    const position = await Position.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      }
    });
    
    if (!position) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Cargo não encontrado' 
      });
    }
    
    // Verificar se departamento existe (se foi informado)
    if (departamentoId) {
      const department = await Department.findOne({
        where: { 
          id: departamentoId,
          tenantId: req.tenantId
        }
      });
      
      if (!department) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Departamento não encontrado' 
        });
      }
    }
    
    // Verificar se já existe outro cargo com este nome e nível no departamento
    if ((nome && nome !== position.nome) || 
        (nivel && nivel !== position.nivel) || 
        (departamentoId && departamentoId !== position.departamentoId)) {
      
      const existingPosition = await Position.findOne({
        where: { 
          nome: nome || position.nome,
          nivel: nivel || position.nivel,
          departamentoId: departamentoId || position.departamentoId,
          tenantId: req.tenantId,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingPosition) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Já existe um cargo com este nome e nível neste departamento' 
        });
      }
    }
    
    // Atualizar cargo
    await position.update({
      nome: nome || position.nome,
      descricao: descricao || position.descricao,
      nivel: nivel || position.nivel,
      departamentoId: departamentoId || position.departamentoId,
      faixaSalarialMin: faixaSalarialMin || position.faixaSalarialMin,
      faixaSalarialMax: faixaSalarialMax || position.faixaSalarialMax,
      status: status || position.status
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Cargo atualizado com sucesso',
      data: {
        cargo: position
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar cargo', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao atualizar cargo' 
    });
  }
};

// Remover cargo (soft delete)
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar cargo
    const position = await Position.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      }
    });
    
    if (!position) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Cargo não encontrado' 
      });
    }
    
    // Verificar se existem colaboradores vinculados
    const employees = await Employee.findAll({
      where: { 
        cargoId: id,
        tenantId: req.tenantId
      }
    });
    
    if (employees.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Não é possível remover um cargo que possui colaboradores vinculados' 
      });
    }
    
    // Remover cargo (soft delete)
    await position.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'Cargo removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover cargo', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao remover cargo' 
    });
  }
};
