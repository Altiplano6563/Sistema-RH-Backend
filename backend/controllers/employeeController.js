const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

// @desc    Obter todos os funcionários
// @route   GET /api/employees
// @access  Private
exports.getEmployees = async (req, res) => {
  try {
    let query;
    
    // Cópia do req.query
    const reqQuery = { ...req.query };
    
    // Campos para excluir
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Remover campos da reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Filtrar por departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      // Verificar se o usuário tem departamentos gerenciados
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        reqQuery.departamento = { $in: req.user.departamentosGerenciados };
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }
    
    // Criar string de consulta
    let queryStr = JSON.stringify(reqQuery);
    
    // Criar operadores ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Encontrar funcionários
    query = Employee.find(JSON.parse(queryStr))
      .populate('departamento')
      .populate('cargo')
      .populate('liderancaDireta');
    
    // Selecionar campos
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }
    
    // Ordenar
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Employee.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executar consulta
    const employees = await query;
    
    // Objeto de paginação
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: employees.length,
      pagination,
      total,
      data: employees
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Obter um funcionário
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('departamento')
      .populate('cargo')
      .populate('liderancaDireta');
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }
    
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === employee.departamento._id.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar este funcionário'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Criar um funcionário
// @route   POST /api/employees
// @access  Private (Admin, Gestor, BusinessPartner)
exports.createEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === req.body.departamento
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para adicionar funcionários a este departamento'
        });
      }
    }
    
    const employee = await Employee.create(req.body);
    
    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (err) {
    console.error(err.message);
    
    // Verificar erro de duplicação
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Funcionário com este email ou CPF já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar um funcionário
// @route   PUT /api/employees/:id
// @access  Private (Admin, Gestor, BusinessPartner)
exports.updateEmployee = async (req, res) => {
  try {
    let employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }
    
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === employee.departamento.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para atualizar este funcionário'
        });
      }
      
      // Se estiver mudando de departamento, verificar acesso ao novo departamento
      if (req.body.departamento && req.body.departamento !== employee.departamento.toString()) {
        const hasAccessToNewDept = req.user.departamentosGerenciados.some(
          (dep) => dep.toString() === req.body.departamento
        );
        
        if (!hasAccessToNewDept) {
          return res.status(403).json({
            success: false,
            error: 'Você não tem permissão para mover este funcionário para o departamento selecionado'
          });
        }
      }
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: employee
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Excluir um funcionário
// @route   DELETE /api/employees/:id
// @access  Private (Admin)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }
    
    await employee.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};
