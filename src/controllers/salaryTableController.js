const SalaryTable = require('../models/SalaryTable');
const { validationResult } = require('express-validator');

// @desc    Obter todas as tabelas salariais
// @route   GET /api/salary-tables
// @access  Private
exports.getSalaryTables = async (req, res) => {
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
      // Buscar cargos dos departamentos gerenciados
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        const Position = require('../models/Position');
        const positions = await Position.find({ departamento: { $in: req.user.departamentosGerenciados } });
        const positionIds = positions.map(pos => pos._id);
        
        reqQuery.cargo = { $in: positionIds };
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
    
    // Encontrar tabelas salariais
    query = SalaryTable.find(JSON.parse(queryStr))
      .populate({
        path: 'cargo',
        populate: {
          path: 'departamento'
        }
      });
    
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
      query = query.sort('cargo nivel');
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
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Obter uma tabela salarial
// @route   GET /api/salary-tables/:id
// @access  Private
exports.getSalaryTable = async (req, res) => {
  try {
    const salaryTable = await SalaryTable.findById(req.params.id)
      .populate({
        path: 'cargo',
        populate: {
          path: 'departamento'
        }
      });
    
    if (!salaryTable) {
      return res.status(404).json({
        success: false,
        error: 'Tabela salarial não encontrada'
      });
    }
    
    // Verificar acesso ao departamento para gestores e business partners
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      const hasAccess = req.user.departamentosGerenciados.some(
        (dep) => dep.toString() === salaryTable.cargo.departamento._id.toString()
      );
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para acessar esta tabela salarial'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: salaryTable
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Criar uma tabela salarial
// @route   POST /api/salary-tables
// @access  Private (Admin, Diretor)
exports.createSalaryTable = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Verificar se já existe uma tabela para este cargo e nível
    const existingTable = await SalaryTable.findOne({
      cargo: req.body.cargo,
      nivel: req.body.nivel
    });
    
    if (existingTable) {
      return res.status(400).json({
        success: false,
        error: 'Já existe uma tabela salarial para este cargo e nível'
      });
    }
    
    const salaryTable = await SalaryTable.create(req.body);
    
    res.status(201).json({
      success: true,
      data: salaryTable
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar uma tabela salarial
// @route   PUT /api/salary-tables/:id
// @access  Private (Admin, Diretor)
exports.updateSalaryTable = async (req, res) => {
  try {
    let salaryTable = await SalaryTable.findById(req.params.id);
    
    if (!salaryTable) {
      return res.status(404).json({
        success: false,
        error: 'Tabela salarial não encontrada'
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
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Excluir uma tabela salarial
// @route   DELETE /api/salary-tables/:id
// @access  Private (Admin)
exports.deleteSalaryTable = async (req, res) => {
  try {
    const salaryTable = await SalaryTable.findById(req.params.id);
    
    if (!salaryTable) {
      return res.status(404).json({
        success: false,
        error: 'Tabela salarial não encontrada'
      });
    }
    
    await salaryTable.remove();
    
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

// @desc    Verificar salários fora da tabela
// @route   GET /api/salary-tables/check-salaries
// @access  Private (Admin, Diretor, BusinessPartner)
exports.checkSalaries = async (req, res) => {
  try {
    const Employee = require('../models/Employee');
    
    // Filtrar por departamentos gerenciados para gestores e business partners
    let departmentFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentFilter = { departamento: { $in: req.user.departamentosGerenciados } };
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }
    
    // Buscar todos os funcionários ativos
    const employees = await Employee.find({ 
      status: 'Ativo',
      ...departmentFilter
    }).populate('cargo').populate('departamento');
    
    const results = [];
    
    // Para cada funcionário, verificar se o salário está dentro da faixa
    for (const employee of employees) {
      // Buscar tabela salarial para o cargo e nível
      const salaryTable = await SalaryTable.findOne({
        cargo: employee.cargo._id,
        nivel: employee.cargo.senioridadeMinima // Assumindo que o nível do funcionário é o mesmo do cargo
      });
      
      if (salaryTable) {
        // Verificar se o salário está fora da faixa
        if (employee.salario < salaryTable.valorMinimo || employee.salario > salaryTable.valorMaximo) {
          results.push({
            funcionario: {
              id: employee._id,
              nome: employee.nome,
              departamento: employee.departamento.nome,
              cargo: employee.cargo.titulo
            },
            salarioAtual: employee.salario,
            faixaMinima: salaryTable.valorMinimo,
            faixaMaxima: salaryTable.valorMaximo,
            status: employee.salario < salaryTable.valorMinimo ? 'Abaixo' : 'Acima'
          });
        }
      }
    }
    
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};
