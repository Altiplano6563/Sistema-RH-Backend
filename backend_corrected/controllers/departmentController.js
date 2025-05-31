const Department = require('../models/Department');
const { validationResult } = require('express-validator');

// @desc    Obter todos os departamentos
// @route   GET /api/departments
// @access  Private
exports.getAllDepartments = async (req, res, next) => {
  try {
    let query;
    
    // Cópia do req.query
    const reqQuery = { ...req.query };
    
    // Campos para excluir
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    // Remover campos da reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    
    // Criar string de consulta
    let queryStr = JSON.stringify(reqQuery);
    
    // Criar operadores ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Encontrar departamentos
    query = Department.find(JSON.parse(queryStr))
      .populate('gestor');
    
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
      query = query.sort('nome');
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
    next(err);
  }
};

// @desc    Obter departamento por ID
// @route   GET /api/departments/:id
// @access  Private
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('gestor');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Criar departamento
// @route   POST /api/departments
// @access  Private (Admin, Diretor)
exports.createDepartment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Apenas Admin e Diretor podem criar departamentos
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para criar departamentos'
      });
    }
    
    const department = await Department.create(req.body);
    
    res.status(201).json({
      success: true,
      data: department
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Atualizar departamento
// @route   PUT /api/departments/:id
// @access  Private (Admin, Diretor, BusinessPartner)
exports.updateDepartment = async (req, res, next) => {
  try {
    let department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.perfil === 'BusinessPartner') {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === department._id.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para atualizar este departamento'
        });
      }
      
      // Business Partners só podem atualizar campos específicos
      const allowedFields = ['descricao', 'gestor', 'orcamento'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    } else if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para atualizar departamentos'
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
    next(err);
  }
};

// @desc    Excluir departamento
// @route   DELETE /api/departments/:id
// @access  Private (Admin, Diretor)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Departamento não encontrado'
      });
    }
    
    // Apenas Admin e Diretor podem excluir departamentos
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para excluir departamentos'
      });
    }
    
    await department.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
