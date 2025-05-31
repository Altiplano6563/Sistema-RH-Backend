const Position = require('../models/Position');
const { validationResult } = require('express-validator');

// @desc    Obter todos os cargos
// @route   GET /api/positions
// @access  Private
exports.getPositions = async (req, res) => {
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
    
    // Encontrar cargos
    query = Position.find(JSON.parse(queryStr))
      .populate('departamento');
    
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
    const total = await Position.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executar consulta
    const positions = await query;
    
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
      count: positions.length,
      pagination,
      total,
      data: positions
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Obter um cargo
// @route   GET /api/positions/:id
// @access  Private
exports.getPosition = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id)
      .populate('departamento');
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Cargo não encontrado'
      });
    }
    
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === position.departamento._id.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar este cargo'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: position
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Criar um cargo
// @route   POST /api/positions
// @access  Private (Admin, Diretor)
exports.createPosition = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const position = await Position.create(req.body);
    
    res.status(201).json({
      success: true,
      data: position
    });
  } catch (err) {
    console.error(err.message);
    
    // Verificar erro de duplicação
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Cargo com este título já existe'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar um cargo
// @route   PUT /api/positions/:id
// @access  Private (Admin, Diretor)
exports.updatePosition = async (req, res) => {
  try {
    let position = await Position.findById(req.params.id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Cargo não encontrado'
      });
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    position = await Position.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: position
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Excluir um cargo
// @route   DELETE /api/positions/:id
// @access  Private (Admin)
exports.deletePosition = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Cargo não encontrado'
      });
    }
    
    await position.remove();
    
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
