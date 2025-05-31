const SalaryTable = require('../models/SalaryTable');
const { validationResult } = require('express-validator');

// @desc    Obter todas as tabelas salariais
// @route   GET /api/salary-tables
// @access  Private
exports.getAllSalaryTables = async (req, res, next) => {
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
    
    // Encontrar tabelas salariais
    query = SalaryTable.find(JSON.parse(queryStr))
      .populate('cargo');
    
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
      query = query.sort('cargo');
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await SalaryTable.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executar consulta
    const salaryTables = await query;
    
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
      count: salaryTables.length,
      pagination,
      total,
      data: salaryTables
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter tabela salarial por ID
// @route   GET /api/salary-tables/:id
// @access  Private
exports.getSalaryTableById = async (req, res, next) => {
  try {
    const salaryTable = await SalaryTable.findById(req.params.id)
      .populate('cargo');
    
    if (!salaryTable) {
      return res.status(404).json({
        success: false,
        error: 'Tabela salarial não encontrada'
      });
    }
    
    res.status(200).json({
      success: true,
      data: salaryTable
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Criar tabela salarial
// @route   POST /api/salary-tables
// @access  Private (Admin, Diretor)
exports.createSalaryTable = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Apenas Admin e Diretor podem criar tabelas salariais
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para criar tabelas salariais'
      });
    }
    
    const salaryTable = await SalaryTable.create(req.body);
    
    res.status(201).json({
      success: true,
      data: salaryTable
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Atualizar tabela salarial
// @route   PUT /api/salary-tables/:id
// @access  Private (Admin, Diretor)
exports.updateSalaryTable = async (req, res, next) => {
  try {
    let salaryTable = await SalaryTable.findById(req.params.id);
    
    if (!salaryTable) {
      return res.status(404).json({
        success: false,
        error: 'Tabela salarial não encontrada'
      });
    }
    
    // Apenas Admin e Diretor podem atualizar tabelas salariais
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para atualizar tabelas salariais'
      });
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    salaryTable = await SalaryTable.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: salaryTable
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Excluir tabela salarial
// @route   DELETE /api/salary-tables/:id
// @access  Private (Admin, Diretor)
exports.deleteSalaryTable = async (req, res, next) => {
  try {
    const salaryTable = await SalaryTable.findById(req.params.id);
    
    if (!salaryTable) {
      return res.status(404).json({
        success: false,
        error: 'Tabela salarial não encontrada'
      });
    }
    
    // Apenas Admin e Diretor podem excluir tabelas salariais
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para excluir tabelas salariais'
      });
    }
    
    await salaryTable.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
