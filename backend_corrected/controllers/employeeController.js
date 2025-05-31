const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

// @desc    Obter todos os funcionários
// @route   GET /api/employees
// @access  Private
exports.getAllEmployees = async (req, res, next) => {
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
    next(err);
  }
};

// @desc    Obter funcionário por ID
// @route   GET /api/employees/:id
// @access  Private
exports.getEmployeeById = async (req, res, next) => {
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
    next(err);
  }
};

// @desc    Criar funcionário
// @route   POST /api/employees
// @access  Private
exports.createEmployee = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
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
    next(err);
  }
};

// @desc    Atualizar funcionário
// @route   PUT /api/employees/:id
// @access  Private
exports.updateEmployee = async (req, res, next) => {
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
            error: 'Você não tem permissão para transferir este funcionário para o departamento selecionado'
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
    next(err);
  }
};

// @desc    Excluir funcionário
// @route   DELETE /api/employees/:id
// @access  Private (Admin, Diretor)
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Funcionário não encontrado'
      });
    }
    
    // Apenas Admin e Diretor podem excluir funcionários
    if (!['Admin', 'Diretor'].includes(req.user.perfil)) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para excluir funcionários'
      });
    }
    
    await employee.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter estatísticas de funcionários
// @route   GET /api/employees/stats
// @access  Private
exports.getEmployeeStats = async (req, res, next) => {
  try {
    // Filtrar por departamento para gestores e business partners
    let departmentFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentFilter = { departamento: { $in: req.user.departamentosGerenciados } };
      } else {
        return res.status(200).json({
          success: true,
          data: {
            total: 0,
            ativos: 0,
            inativos: 0,
            afastados: 0,
            ferias: 0,
            licencaMaternidade: 0
          }
        });
      }
    }
    
    // Total de funcionários
    const total = await Employee.countDocuments(departmentFilter);
    
    // Funcionários por status
    const ativos = await Employee.countDocuments({ ...departmentFilter, status: 'Ativo' });
    const inativos = await Employee.countDocuments({ ...departmentFilter, status: 'Inativo' });
    const afastados = await Employee.countDocuments({ ...departmentFilter, status: 'Afastado' });
    const ferias = await Employee.countDocuments({ ...departmentFilter, status: 'Férias' });
    const licencaMaternidade = await Employee.countDocuments({ ...departmentFilter, status: 'Licença Maternidade' });
    
    res.status(200).json({
      success: true,
      data: {
        total,
        ativos,
        inativos,
        afastados,
        ferias,
        licencaMaternidade
      }
    });
  } catch (err) {
    next(err);
  }
};
