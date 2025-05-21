const { Employee, Department, Position, Movement, Tenant } = require('../models');
const logger = require('../utils/logger');

// Listar colaboradores
exports.getEmployees = async (req, res) => {
  try {
    const { search, departamentoId, cargoId, status, modalidade } = req.query;
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
    
    if (cargoId) {
      where.cargoId = cargoId;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (modalidade) {
      where.modalidadeTrabalho = modalidade;
    }
    
    // Buscar colaboradores com paginação
    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          as: 'departamento',
          attributes: ['id', 'nome']
        },
        {
          model: Position,
          as: 'cargo',
          attributes: ['id', 'nome', 'nivel']
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
      message: 'Colaboradores listados com sucesso',
      data: {
        colaboradores: rows,
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
    logger.error('Erro ao listar colaboradores', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao listar colaboradores' 
    });
  }
};

// Obter colaborador por ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar colaborador com detalhes
    const employee = await Employee.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      },
      include: [
        {
          model: Department,
          as: 'departamento',
          attributes: ['id', 'nome']
        },
        {
          model: Position,
          as: 'cargo',
          attributes: ['id', 'nome', 'nivel']
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Colaborador não encontrado' 
      });
    }
    
    // Buscar movimentações do colaborador
    const movements = await Movement.findAll({
      where: {
        colaboradorId: id,
        tenantId: req.tenantId
      },
      order: [['dataEfetivacao', 'DESC']]
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Colaborador encontrado com sucesso',
      data: {
        colaborador: employee,
        movimentacoes: movements
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar colaborador', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar colaborador' 
    });
  }
};

// Criar novo colaborador
exports.createEmployee = async (req, res) => {
  try {
    const {
      nome,
      email,
      cpf,
      dataNascimento,
      genero,
      telefone,
      endereco,
      departamentoId,
      cargoId,
      salario,
      dataAdmissao,
      modalidadeTrabalho,
      cargaHoraria,
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
    
    // Verificar se cargo existe
    const position = await Position.findOne({
      where: { 
        id: cargoId,
        tenantId: req.tenantId
      }
    });
    
    if (!position) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Cargo não encontrado' 
      });
    }
    
    // Verificar se já existe colaborador com este CPF
    const existingEmployee = await Employee.findOne({
      where: { 
        cpf,
        tenantId: req.tenantId
      }
    });
    
    if (existingEmployee) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'CPF já cadastrado' 
      });
    }
    
    // Criar novo colaborador
    const employee = await Employee.create({
      tenantId: req.tenantId,
      nome,
      email,
      cpf,
      dataNascimento,
      genero,
      telefone,
      endereco,
      departamentoId,
      cargoId,
      salario,
      dataAdmissao,
      modalidadeTrabalho,
      cargaHoraria,
      status
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Colaborador criado com sucesso',
      data: {
        colaborador: employee
      }
    });
  } catch (error) {
    logger.error('Erro ao criar colaborador', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao criar colaborador' 
    });
  }
};

// Atualizar colaborador
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      dataNascimento,
      genero,
      telefone,
      endereco,
      departamentoId,
      cargoId,
      salario,
      modalidadeTrabalho,
      cargaHoraria,
      status
    } = req.body;
    
    // Buscar colaborador
    const employee = await Employee.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      }
    });
    
    if (!employee) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Colaborador não encontrado' 
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
    
    // Verificar se cargo existe (se foi informado)
    if (cargoId) {
      const position = await Position.findOne({
        where: { 
          id: cargoId,
          tenantId: req.tenantId
        }
      });
      
      if (!position) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Cargo não encontrado' 
        });
      }
    }
    
    // Atualizar colaborador
    await employee.update({
      nome: nome || employee.nome,
      email: email || employee.email,
      dataNascimento: dataNascimento || employee.dataNascimento,
      genero: genero || employee.genero,
      telefone: telefone || employee.telefone,
      endereco: endereco || employee.endereco,
      departamentoId: departamentoId || employee.departamentoId,
      cargoId: cargoId || employee.cargoId,
      salario: salario || employee.salario,
      modalidadeTrabalho: modalidadeTrabalho || employee.modalidadeTrabalho,
      cargaHoraria: cargaHoraria || employee.cargaHoraria,
      status: status || employee.status
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Colaborador atualizado com sucesso',
      data: {
        colaborador: employee
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar colaborador', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao atualizar colaborador' 
    });
  }
};

// Remover colaborador (soft delete)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar colaborador
    const employee = await Employee.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      }
    });
    
    if (!employee) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Colaborador não encontrado' 
      });
    }
    
    // Remover colaborador (soft delete)
    await employee.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'Colaborador removido com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao remover colaborador', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao remover colaborador' 
    });
  }
};
