const Movement = require('../models/Movement');
const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

// @desc    Obter todas as movimentações
// @route   GET /api/movements
// @access  Private
exports.getAllMovements = async (req, res, next) => {
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
        // Buscar funcionários dos departamentos gerenciados
        const employees = await Employee.find({
          departamento: { $in: req.user.departamentosGerenciados }
        }).select('_id');
        
        const employeeIds = employees.map(emp => emp._id);
        
        reqQuery.funcionario = { $in: employeeIds };
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
    next(err);
  }
};

// @desc    Obter movimentação por ID
// @route   GET /api/movements/:id
// @access  Private
exports.getMovementById = async (req, res, next) => {
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
    
    // Verificar acesso para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      // Buscar funcionário para verificar departamento
      const employee = await Employee.findById(movement.funcionario._id);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Funcionário não encontrado'
        });
      }
      
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === employee.departamento.toString()
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
    next(err);
  }
};

// @desc    Criar movimentação
// @route   POST /api/movements
// @access  Private (Admin, Diretor, BusinessPartner)
exports.createMovement = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    // Verificar acesso para business partners
    if (req.user.perfil === 'BusinessPartner') {
      // Buscar funcionário para verificar departamento
      const employee = await Employee.findById(req.body.funcionario);
      
      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Funcionário não encontrado'
        });
      }
      
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === employee.departamento.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para criar movimentações para este funcionário'
        });
      }
    } else if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para criar movimentações'
      });
    }
    
    const movement = await Movement.create(req.body);
    
    res.status(201).json({
      success: true,
      data: movement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Atualizar movimentação
// @route   PUT /api/movements/:id
// @access  Private (Admin, Diretor)
exports.updateMovement = async (req, res, next) => {
  try {
    let movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    // Apenas Admin e Diretor podem atualizar movimentações
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para atualizar movimentações'
      });
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    movement = await Movement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: movement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Aprovar movimentação
// @route   PUT /api/movements/:id/approve
// @access  Private (Admin, Diretor)
exports.approveMovement = async (req, res, next) => {
  try {
    let movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    // Apenas Admin e Diretor podem aprovar movimentações
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para aprovar movimentações'
      });
    }
    
    // Verificar se já está aprovada
    if (movement.status === 'Aprovado') {
      return res.status(400).json({
        success: false,
        error: 'Movimentação já aprovada'
      });
    }
    
    // Atualizar status e aprovador
    movement.status = 'Aprovado';
    movement.aprovadoPor = req.user.id;
    movement.updatedAt = Date.now();
    
    await movement.save();
    
    // Atualizar funcionário conforme o tipo de movimentação
    const employee = await Employee.findById(movement.funcionario);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }
    
    // Aplicar mudanças conforme o tipo de movimentação
    switch (movement.tipo) {
      case 'Promoção':
        if (movement.cargoNovo) {
          employee.cargo = movement.cargoNovo;
        }
        if (movement.salarioNovo) {
          employee.salario = movement.salarioNovo;
        }
        break;
      case 'Transferência':
        if (movement.departamentoNovo) {
          employee.departamento = movement.departamentoNovo;
        }
        break;
      case 'Ajuste Salarial':
      case 'Mérito':
      case 'Equiparação Salarial':
        if (movement.salarioNovo) {
          employee.salario = movement.salarioNovo;
        }
        break;
      case 'Mudança de Horário':
        if (req.body.horarioTrabalho) {
          employee.horarioTrabalho = req.body.horarioTrabalho;
        }
        break;
      case 'Mudança de Modalidade':
        if (req.body.modalidadeTrabalho) {
          employee.modalidadeTrabalho = req.body.modalidadeTrabalho;
        }
        break;
      case 'Desligamento':
        employee.status = 'Inativo';
        break;
      case 'Afastamento':
        employee.status = 'Afastado';
        break;
      case 'Licença Maternidade':
        employee.status = 'Licença Maternidade';
        break;
    }
    
    employee.updatedAt = Date.now();
    await employee.save();
    
    res.status(200).json({
      success: true,
      data: movement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Rejeitar movimentação
// @route   PUT /api/movements/:id/reject
// @access  Private (Admin, Diretor)
exports.rejectMovement = async (req, res, next) => {
  try {
    let movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    // Apenas Admin e Diretor podem rejeitar movimentações
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para rejeitar movimentações'
      });
    }
    
    // Verificar se já está rejeitada
    if (movement.status === 'Rejeitado') {
      return res.status(400).json({
        success: false,
        error: 'Movimentação já rejeitada'
      });
    }
    
    // Atualizar status e motivo de rejeição
    movement.status = 'Rejeitado';
    movement.motivoRejeicao = req.body.motivoRejeicao;
    movement.updatedAt = Date.now();
    
    await movement.save();
    
    res.status(200).json({
      success: true,
      data: movement
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Excluir movimentação
// @route   DELETE /api/movements/:id
// @access  Private (Admin, Diretor)
exports.deleteMovement = async (req, res, next) => {
  try {
    const movement = await Movement.findById(req.params.id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        error: 'Movimentação não encontrada'
      });
    }
    
    // Apenas Admin e Diretor podem excluir movimentações
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para excluir movimentações'
      });
    }
    
    await movement.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
