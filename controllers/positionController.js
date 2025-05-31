const Position = require('../models/Position');
const { validationResult } = require('express-validator');

// @desc    Obter todos os cargos
// @route   GET /api/positions
// @access  Private
exports.getAllPositions = async (req, res, next) => {
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
      query = query.sort('titulo');
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
    next(err);
  }
};

// @desc    Obter cargo por ID
// @route   GET /api/positions/:id
// @access  Private
exports.getPositionById = async (req, res, next) => {
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
    next(err);
  }
};

// @desc    Criar cargo
// @route   POST /api/positions
// @access  Private (Admin, Diretor, BusinessPartner)
exports.createPosition = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Verificar acesso ao departamento para business partners
    if (req.user.perfil === 'BusinessPartner') {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === req.body.departamento
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para adicionar cargos a este departamento'
        });
      }
    } else if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para criar cargos'
      });
    }
    
    const position = await Position.create(req.body);
    
    res.status(201).json({
      success: true,
      data: position
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Atualizar cargo
// @route   PUT /api/positions/:id
// @access  Private (Admin, Diretor, BusinessPartner)
exports.updatePosition = async (req, res, next) => {
  try {
    let position = await Position.findById(req.params.id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Cargo não encontrado'
      });
    }
    
    // Verificar acesso ao departamento para business partners
    if (req.user.perfil === 'BusinessPartner') {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === position.departamento.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para atualizar este cargo'
        });
      }
      
      // Se estiver mudando de departamento, verificar acesso ao novo departamento
      if (req.body.departamento && req.body.departamento !== position.departamento.toString()) {
        const hasAccessToNewDept = req.user.departamentosGerenciados.some(
          (dep) => dep.toString() === req.body.departamento
        );
        
        if (!hasAccessToNewDept) {
          return res.status(403).json({
            success: false,
            error: 'Você não tem permissão para transferir este cargo para o departamento selecionado'
          });
        }
      }
    } else if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para atualizar cargos'
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
    next(err);
  }
};

// @desc    Excluir cargo
// @route   DELETE /api/positions/:id
// @access  Private (Admin, Diretor)
exports.deletePosition = async (req, res, next) => {
  try {
    const position = await Position.findById(req.params.id);
    
    if (!position) {
      return res.status(404).json({
        success: false,
        error: 'Cargo não encontrado'
      });
    }
    
    // Apenas Admin e Diretor podem excluir cargos
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para excluir cargos'
      });
    }
    
    await position.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
