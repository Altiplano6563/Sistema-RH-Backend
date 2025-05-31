const DashboardMetric = require('../models/DashboardMetric');
const { validationResult } = require('express-validator');

// @desc    Obter todas as métricas do dashboard
// @route   GET /api/dashboard/metrics
// @access  Private
exports.getDashboardMetrics = async (req, res) => {
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
    
    // Encontrar métricas
    query = DashboardMetric.find(JSON.parse(queryStr))
      .populate('departamento')
      .populate('lideranca');
    
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
      query = query.sort('-periodo.ano -periodo.mes');
    }
    
    // Paginação
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await DashboardMetric.countDocuments(JSON.parse(queryStr));
    
    query = query.skip(startIndex).limit(limit);
    
    // Executar consulta
    const metrics = await query;
    
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
      count: metrics.length,
      pagination,
      total,
      data: metrics
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Criar uma métrica do dashboard
// @route   POST /api/dashboard/metrics
// @access  Private (Admin, Diretor, BusinessPartner)
exports.createDashboardMetric = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Verificar acesso ao departamento para business partners
    if (req.user.perfil === 'BusinessPartner' && req.body.departamento) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === req.body.departamento
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para adicionar métricas a este departamento'
        });
      }
    }
    
    const metric = await DashboardMetric.create(req.body);
    
    res.status(201).json({
      success: true,
      data: metric
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar uma métrica do dashboard
// @route   PUT /api/dashboard/metrics/:id
// @access  Private (Admin, Diretor, BusinessPartner)
exports.updateDashboardMetric = async (req, res) => {
  try {
    let metric = await DashboardMetric.findById(req.params.id);
    
    if (!metric) {
      return res.status(404).json({
        success: false,
        error: 'Métrica não encontrada'
      });
    }
    
    // Verificar acesso ao departamento para business partners
    if (req.user.perfil === 'BusinessPartner') {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === metric.departamento.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para atualizar esta métrica'
        });
      }
    }
    
    // Atualizar data de modificação
    req.body.updatedAt = Date.now();
    
    metric = await DashboardMetric.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: metric
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Excluir uma métrica do dashboard
// @route   DELETE /api/dashboard/metrics/:id
// @access  Private (Admin, Diretor)
exports.deleteDashboardMetric = async (req, res) => {
  try {
    const metric = await DashboardMetric.findById(req.params.id);
    
    if (!metric) {
      return res.status(404).json({
        success: false,
        error: 'Métrica não encontrada'
      });
    }
    
    await metric.remove();
    
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

// @desc    Obter resumo do dashboard
// @route   GET /api/dashboard/summary
// @access  Private
exports.getDashboardSummary = async (req, res) => {
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
            headcount: 0,
            contratacoes: 0,
            desligamentos: 0,
            turnover: 0,
            orcamentoBudget: 0,
            custoAtivo: 0,
            orcamentoHeadcount: 0,
            headcountAtivo: 0,
            promocoes: 0,
            meritos: 0
          }
        });
      }
    }
    
    // Obter ano e mês atual para filtrar métricas
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Filtro de período
    const periodFilter = {
      'periodo.ano': currentYear,
      'periodo.mes': currentMonth
    };
    
    // Buscar métricas do mês atual
    const headcountMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'headcount'
    });
    
    const contratacaoMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'contratacao'
    });
    
    const desligamentoMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'desligamento'
    });
    
    const turnoverMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'turnover'
    });
    
    const orcamentoMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'orcamento'
    });
    
    const promocaoMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'promocao'
    });
    
    const meritoMetric = await DashboardMetric.findOne({
      ...departmentFilter,
      ...periodFilter,
      tipo: 'merito'
    });
    
    // Calcular headcount ativo
    const Employee = require('../models/Employee');
    let headcountQuery = { status: 'Ativo' };
    
    if (Object.keys(departmentFilter).length > 0) {
      headcountQuery = {
        ...headcountQuery,
        departamento: departmentFilter.departamento
      };
    }
    
    const headcountAtivo = await Employee.countDocuments(headcountQuery);
    
    // Calcular custo ativo (soma dos salários)
    const employees = await Employee.find(headcountQuery);
    const custoAtivo = employees.reduce((total, emp) => total + emp.salario, 0);
    
    res.status(200).json({
      success: true,
      data: {
        headcount: headcountMetric ? headcountMetric.valor : 0,
        contratacoes: contratacaoMetric ? contratacaoMetric.valor : 0,
        desligamentos: desligamentoMetric ? desligamentoMetric.valor : 0,
        turnover: turnoverMetric ? turnoverMetric.valor : 0,
        orcamentoBudget: orcamentoMetric ? orcamentoMetric.valor : 0,
        custoAtivo,
        orcamentoHeadcount: headcountMetric ? headcountMetric.valor : 0,
        headcountAtivo,
        promocoes: promocaoMetric ? promocaoMetric.valor : 0,
        meritos: meritoMetric ? meritoMetric.valor : 0
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};
