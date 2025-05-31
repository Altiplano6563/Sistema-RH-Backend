const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Obter todos os departamentos
// @route   GET /api/departments
// @access  Private
exports.getDepartments = async (req, res) => {
  try {
    let query;
    
    // Cópia do req.query
    const reqQuery = { ...req.query };
    
    // Campos para excluir
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Remover campos da reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Filtrar por departamentos gerenciados para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      // Verificar se o usuário tem departamentos gerenciados
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        reqQuery._id = { $in: req.user.departamentosGerenciados };
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
    
    // Encontrar departamentos
    query = Department.find(JSON.parse(queryStr))
      .populate('gestor')
      .populate('businessPartner');
    
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
    const total = await Department.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executar consulta
    const departments = await query;
    
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
      count: departments.length,
      pagination,
      total,
      data: departments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Obter um departamento
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('gestor')
      .populate('businessPartner');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }
    
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === department._id.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar este departamento'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Criar um departamento
// @route   POST /api/departments
// @access  Private (Admin, Diretor)
exports.createDepartment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const department = await Department.create(req.body);
    
    res.status(201).json({
      success: true,
      data: department
    });
  } catch (err) {
    console.error(err.message);
    
    // Verificar erro de duplicação
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Departamento com este nome já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar um departamento
// @route   PUT /api/departments/:id
// @access  Private (Admin, Diretor)
exports.updateDepartment = async (req, res) => {
  try {
    let department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Excluir um departamento
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }
    
    await department.remove();
    
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
