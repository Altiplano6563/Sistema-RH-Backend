const { Department, Employee, Tenant } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Listar departamentos
exports.getDepartments = async (req, res) => {
  try {
    const { search, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Construir condições de busca
    const where = { tenantId: req.tenantId };
    
    if (search) {
      where.nome = { [Op.iLike]: `%${search}%` };
    }
    
    if (status) {
      where.status = status;
    }
    
    // Buscar departamentos com paginação
    const { count, rows } = await Department.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'responsavel',
          attributes: ['id', 'nome']
        },
        {
          model: Department,
          as: 'departamentoPai',
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
      message: 'Departamentos listados com sucesso',
      data: {
        departamentos: rows,
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
    logger.error('Erro ao listar departamentos', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao listar departamentos' 
    });
  }
};

// Obter departamento por ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar departamento com detalhes
    const department = await Department.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      },
      include: [
        {
          model: Employee,
          as: 'responsavel',
          attributes: ['id', 'nome']
        },
        {
          model: Department,
          as: 'departamentoPai',
          attributes: ['id', 'nome']
        },
        {
          model: Department,
          as: 'departamentosFilhos',
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!department) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Departamento não encontrado' 
      });
    }
    
    // Buscar colaboradores do departamento
    const employees = await Employee.findAll({
      where: {
        departamentoId: id,
        tenantId: req.tenantId
      },
      attributes: ['id', 'nome', 'email', 'cargoId', 'status']
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Departamento encontrado com sucesso',
      data: {
        departamento: department,
        colaboradores: employees
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar departamento', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar departamento' 
    });
  }
};

// Criar novo departamento
exports.createDepartment = async (req, res) => {
  try {
    const {
      nome,
      descricao,
      responsavelId,
      departamentoPaiId,
      centroCusto,
      orcamento,
      status
    } = req.body;
    
    // Verificar se responsável existe (se foi informado)
    if (responsavelId) {
      const employee = await Employee.findOne({
        where: { 
          id: responsavelId,
          tenantId: req.tenantId
        }
      });
      
      if (!employee) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Responsável não encontrado' 
        });
      }
    }
    
    // Verificar se departamento pai existe (se foi informado)
    if (departamentoPaiId) {
      const parentDepartment = await Department.findOne({
        where: { 
          id: departamentoPaiId,
          tenantId: req.tenantId
        }
      });
      
      if (!parentDepartment) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Departamento pai não encontrado' 
        });
      }
    }
    
    // Verificar se já existe departamento com este nome
    const existingDepartment = await Department.findOne({
      where: { 
        nome,
        tenantId: req.tenantId
      }
    });
    
    if (existingDepartment) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Já existe um departamento com este nome' 
      });
    }
    
    // Criar novo departamento
    const department = await Department.create({
      tenantId: req.tenantId,
      nome,
      descricao,
      responsavelId,
      departamentoPaiId,
      centroCusto,
      orcamento,
      status: status || 'ativo'
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Departamento criado com sucesso',
      data: {
        departamento: department
      }
    });
  } catch (error) {
    logger.error('Erro ao criar departamento', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao criar departamento' 
    });
  }
};

// Atualizar departamento
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      descricao,
      responsavelId,
      departamentoPaiId,
      centroCusto,
      orcamento,
      status
    } = req.body;
    
    // Buscar departamento
    const department = await Department.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      }
    });
    
    if (!department) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Departamento não encontrado' 
      });
    }
    
    // Verificar se responsável existe (se foi informado)
    if (responsavelId) {
      const employee = await Employee.findOne({
        where: { 
          id: responsavelId,
          tenantId: req.tenantId
        }
      });
      
      if (!employee) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Responsável não encontrado' 
        });
      }
    }
    
    // Verificar se departamento pai existe (se foi informado)
    if (departamentoPaiId) {
      // Não permitir que um departamento seja pai dele mesmo
      if (departamentoPaiId === id) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Um departamento não pode ser pai dele mesmo' 
        });
      }
      
      const parentDepartment = await Department.findOne({
        where: { 
          id: departamentoPaiId,
          tenantId: req.tenantId
        }
      });
      
      if (!parentDepartment) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Departamento pai não encontrado' 
        });
      }
    }
    
    // Verificar se já existe outro departamento com este nome
    if (nome && nome !== department.nome) {
      const existingDepartment = await Department.findOne({
        where: { 
          nome,
          tenantId: req.tenantId,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingDepartment) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Já existe um departamento com este nome' 
        });
      }
    }
    
    // Atualizar departamento
    await department.update({
      nome: nome || department.nome,
      descricao: descricao || department.descricao,
      responsavelId: responsavelId !== undefined ? responsavelId : department.responsavelId,
      departamentoPaiId: departamentoPaiId !== undefined ? departamentoPaiId : department.departamentoPaiId,
      centroCusto: centroCusto || department.centroCusto,
      orcamento: orcamento || department.orcamento,
      status: status || department.status
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Departamento atualizado com sucesso',
      data: {
        departamento: department
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar departamento', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao atualizar departamento' 
    });
  }
};

// Remover departamento (soft delete)
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar departamento
    const department = await Department.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      }
    });
    
    if (!department) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Departamento não encontrado' 
      });
    }
    
    // Verificar se existem departamentos filhos
    const childDepartments = await Department.findAll({
      where: { 
        departamentoPaiId: id,
        tenantId: req.tenantId
      }
    });
    
    if (childDepartments.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Não é possível remover um departamento que possui departamentos filhos' 
      });
    }
    
    // Verificar se existem colaboradores vinculados
    const employees = await Employee.findAll({
      where: { 
        departamentoId: id,
        tenantId: req.tenantId
      }
    });
    
    if (employees.length > 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Não é possível remover um departamento que possui colaboradores vinculados' 
      });
    }
    
    // Remover departamento (soft delete)
    await department.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'Departamento removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover departamento', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao remover departamento' 
    });
  }
};
