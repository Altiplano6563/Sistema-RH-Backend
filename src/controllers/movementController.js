const Movement = require('../models/Movement');
const { validationResult } = require('express-validator');

// @desc    Obter todas as movimentações
// @route   GET /api/movements
// @access  Private
exports.getMovements = async (req, res) => {
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
        reqQuery.$or = [
          { departamentoAnterior: { $in: req.user.departamentosGerenciados } },
          { departamentoNovo: { $in: req.user.departamentosGerenciados } }
        ];
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
    
    // Encontrar movimentações
    query = Movement.find(JSON.parse(queryStr))
      .populate({
        path: 'funcionario',
        select: 'nome email departamento cargo'
      })
      .populate('cargoAnterior')
      .populate('cargoNovo')
      .populate('departamentoAnterior')
      .populate('departamentoNovo')
      .populate('aprovadoPor');
    
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
      query = query.sort('-dataEfetivacao');
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Movement.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executar consulta
    const movements = await query;
    
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
      count: movements.length,
      pagination,
      total,
      data: movements
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Obter uma movimentação
// @route   GET /api/movements/:id
// @access  Private
exports.getMovement = async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id)
      .populate({
        path: 'funcionario',
        select: 'nome email departamento cargo'
      })
      .populate('cargoAnterior')
      .populate('cargoNovo')
      .populate('departamentoAnterior')
      .populate('departamentoNovo')
      .populate('aprovadoPor');
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => 
          (movement.departamentoAnterior && dep.toString() === movement.departamentoAnterior._id.toString()) ||
          (movement.departamentoNovo && dep.toString() === movement.departamentoNovo._id.toString())
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar esta movimentação'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: movement
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Criar uma movimentação
// @route   POST /api/movements
// @access  Private (Admin, Diretor, Gestor)
exports.createMovement = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Adicionar o usuário que aprovou (se for Admin ou Diretor)
    if (['Admin', 'Diretor'].includes(req.user.perfil)) {
      req.body.aprovadoPor = req.user.id;
      req.body.status = 'Aprovado';
    } else {
      req.body.status = 'Pendente';
    }
    
    const movement = await Movement.create(req.body);
    
    res.status(201).json({
      success: true,
      data: movement
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar uma movimentação
// @route   PUT /api/movements/:id
// @access  Private (Admin, Diretor)
exports.updateMovement = async (req, res) => {
  try {
    let movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    // Se estiver aprovando, adicionar o usuário que aprovou
    if (req.body.status === 'Aprovado' && ['Admin', 'Diretor'].includes(req.user.perfil)) {
      req.body.aprovadoPor = req.user.id;
    }
    
    movement = await Movement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: movement
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Excluir uma movimentação
// @route   DELETE /api/movements/:id
// @access  Private (Admin)
exports.deleteMovement = async (req, res) => {
  try {
    const movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    await movement.remove();
    
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
