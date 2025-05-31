const Employee = require('../models/Employee');
const Department = require('../models/Department');
const Position = require('../models/Position');
const Movement = require('../models/Movement');
const DashboardMetric = require('../models/DashboardMetric');

// @desc    Obter estatísticas gerais do dashboard
// @route   GET /api/dashboard/stats
// @access  Private
exports.getStats = async (req, res, next) => {
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
            totalEmployees: 0,
            activeEmployees: 0,
            departments: 0,
            positions: 0,
            recentMovements: []
          }
        });
      }
    }
    
    // Total de funcionários
    const totalEmployees = await Employee.countDocuments(departmentFilter);
    
    // Funcionários ativos
    const activeEmployees = await Employee.countDocuments({ 
      ...departmentFilter, 
      status: 'Ativo' 
    });
    
    // Total de departamentos
    let departments;
    if (['Admin', 'Diretor'].includes(req.user.perfil)) {
      departments = await Department.countDocuments();
    } else {
      departments = req.user.departamentosGerenciados ? req.user.departamentosGerenciados.length : 0;
    }
    
    // Total de cargos
    let positionFilter = {};
    if (Object.keys(departmentFilter).length > 0) {
      positionFilter = { departamento: departmentFilter.departamento };
    }
    const positions = await Position.countDocuments(positionFilter);
    
    // Movimentações recentes
    let movementFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        // Buscar funcionários dos departamentos gerenciados
        const employees = await Employee.find({
          departamento: { $in: req.user.departamentosGerenciados }
        }).select('_id');
        
        const employeeIds = employees.map(emp => emp._id);
        
        movementFilter = { funcionario: { $in: employeeIds } };
      }
    }
    
    const recentMovements = await Movement.find(movementFilter)
      .sort('-dataEfetivacao')
      .limit(5)
      .populate({
        path: 'funcionario',
        select: 'nome email'
      });
    
    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        departments,
        positions,
        recentMovements
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter distribuição por departamento
// @route   GET /api/dashboard/department-distribution
// @access  Private
exports.getDepartmentDistribution = async (req, res, next) => {
  try {
    // Filtrar por departamento para gestores e business partners
    let departmentFilter = {};
    let departmentIds = [];
    
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentIds = req.user.departamentosGerenciados;
        departmentFilter = { _id: { $in: departmentIds } };
      } else {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }
    
    // Buscar departamentos
    const departments = await Department.find(departmentFilter);
    
    // Contar funcionários por departamento
    const distribution = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ 
          departamento: dept._id,
          status: 'Ativo'
        });
        
        return {
          _id: dept._id,
          nome: dept.nome,
          count
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter distribuição por cargo
// @route   GET /api/dashboard/position-distribution
// @access  Private
exports.getPositionDistribution = async (req, res, next) => {
  try {
    // Filtrar por departamento para gestores e business partners
    let departmentFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentFilter = { departamento: { $in: req.user.departamentosGerenciados } };
      } else {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }
    
    // Buscar cargos
    const positions = await Position.find(departmentFilter);
    
    // Contar funcionários por cargo
    const distribution = await Promise.all(
      positions.map(async (pos) => {
        const count = await Employee.countDocuments({ 
          cargo: pos._id,
          status: 'Ativo'
        });
        
        return {
          _id: pos._id,
          titulo: pos.titulo,
          nivel: pos.nivel,
          count
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter distribuição por modalidade de trabalho
// @route   GET /api/dashboard/workmode-distribution
// @access  Private
exports.getWorkModeDistribution = async (req, res, next) => {
  try {
    // Filtrar por departamento para gestores e business partners
    let departmentFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentFilter = { departamento: { $in: req.user.departamentosGerenciados } };
      } else {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }
    
    // Adicionar filtro de status ativo
    const filter = {
      ...departmentFilter,
      status: 'Ativo'
    };
    
    // Contar funcionários por modalidade de trabalho
    const presencial = await Employee.countDocuments({ 
      ...filter,
      modalidadeTrabalho: 'Presencial'
    });
    
    const remoto = await Employee.countDocuments({ 
      ...filter,
      modalidadeTrabalho: 'Remoto'
    });
    
    const hibrido = await Employee.countDocuments({ 
      ...filter,
      modalidadeTrabalho: 'Híbrido'
    });
    
    res.status(200).json({
      success: true,
      data: [
        { modalidade: 'Presencial', count: presencial },
        { modalidade: 'Remoto', count: remoto },
        { modalidade: 'Híbrido', count: hibrido }
      ]
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter distribuição por carga horária
// @route   GET /api/dashboard/workload-distribution
// @access  Private
exports.getWorkloadDistribution = async (req, res, next) => {
  try {
    // Filtrar por departamento para gestores e business partners
    let departmentFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentFilter = { departamento: { $in: req.user.departamentosGerenciados } };
      } else {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }
    
    // Adicionar filtro de status ativo
    const filter = {
      ...departmentFilter,
      status: 'Ativo'
    };
    
    // Contar funcionários por carga horária
    const carga150 = await Employee.countDocuments({ 
      ...filter,
      cargaHoraria: 150
    });
    
    const carga180 = await Employee.countDocuments({ 
      ...filter,
      cargaHoraria: 180
    });
    
    const carga200 = await Employee.countDocuments({ 
      ...filter,
      cargaHoraria: 200
    });
    
    const carga220 = await Employee.countDocuments({ 
      ...filter,
      cargaHoraria: 220
    });
    
    res.status(200).json({
      success: true,
      data: [
        { cargaHoraria: 150, count: carga150 },
        { cargaHoraria: 180, count: carga180 },
        { cargaHoraria: 200, count: carga200 },
        { cargaHoraria: 220, count: carga220 }
      ]
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter histórico de movimentações
// @route   GET /api/dashboard/movement-history
// @access  Private
exports.getMovementHistory = async (req, res, next) => {
  try {
    // Número de meses para buscar (padrão: 12)
    const meses = parseInt(req.query.meses) || 12;
    
    // Data inicial (meses atrás)
    const dataInicial = new Date();
    dataInicial.setMonth(dataInicial.getMonth() - meses);
    dataInicial.setDate(1);
    dataInicial.setHours(0, 0, 0, 0);
    
    // Filtrar por departamento para gestores e business partners
    let departmentFilter = {};
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        // Buscar funcionários dos departamentos gerenciados
        const employees = await Employee.find({
          departamento: { $in: req.user.departamentosGerenciados }
        }).select('_id');
        
        const employeeIds = employees.map(emp => emp._id);
        
        departmentFilter = { funcionario: { $in: employeeIds } };
      } else {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }
    
    // Buscar movimentações no período
    const movements = await Movement.find({
      ...departmentFilter,
      dataEfetivacao: { $gte: dataInicial }
    }).sort('dataEfetivacao');
    
    // Agrupar por mês e tipo
    const history = [];
    
    // Criar array com todos os meses do período
    const hoje = new Date();
    for (let i = 0; i < meses; i++) {
      const data = new Date();
      data.setMonth(hoje.getMonth() - i);
      
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      
      history.push({
        periodo: `${ano}-${mes.toString().padStart(2, '0')}`,
        promocoes: 0,
        transferencias: 0,
        ajustesSalariais: 0,
        desligamentos: 0,
        afastamentos: 0
      });
    }
    
    // Contar movimentações por mês e tipo
    movements.forEach(movement => {
      const data = new Date(movement.dataEfetivacao);
      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      const periodo = `${ano}-${mes.toString().padStart(2, '0')}`;
      
      const index = history.findIndex(item => item.periodo === periodo);
      if (index !== -1) {
        switch (movement.tipo) {
          case 'Promoção':
            history[index].promocoes++;
            break;
          case 'Transferência':
            history[index].transferencias++;
            break;
          case 'Ajuste Salarial':
          case 'Mérito':
          case 'Equiparação Salarial':
            history[index].ajustesSalariais++;
            break;
          case 'Desligamento':
            history[index].desligamentos++;
            break;
          case 'Afastamento':
          case 'Licença Maternidade':
            history[index].afastamentos++;
            break;
        }
      }
    });
    
    // Ordenar por período (mais recente primeiro)
    history.sort((a, b) => b.periodo.localeCompare(a.periodo));
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter análise salarial
// @route   GET /api/dashboard/salary-analysis
// @access  Private
exports.getSalaryAnalysis = async (req, res, next) => {
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
            salarioMedio: 0,
            salarioPorNivel: [],
            salarioForaTabela: []
          }
        });
      }
    }
    
    // Adicionar filtro de status ativo
    const filter = {
      ...departmentFilter,
      status: 'Ativo'
    };
    
    // Buscar funcionários ativos
    const employees = await Employee.find(filter)
      .populate('cargo')
      .select('nome salario cargo nivelCarreira notaAvaliacao');
    
    // Calcular salário médio
    let salarioTotal = 0;
    employees.forEach(emp => {
      salarioTotal += emp.salario;
    });
    
    const salarioMedio = employees.length > 0 ? salarioTotal / employees.length : 0;
    
    // Agrupar por nível de carreira
    const niveis = ['Junior', 'Pleno', 'Senior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor'];
    
    const salarioPorNivel = niveis.map(nivel => {
      const funcionariosNivel = employees.filter(emp => emp.nivelCarreira === nivel);
      
      let salarioNivelTotal = 0;
      funcionariosNivel.forEach(emp => {
        salarioNivelTotal += emp.salario;
      });
      
      const media = funcionariosNivel.length > 0 ? salarioNivelTotal / funcionariosNivel.length : 0;
      
      return {
        nivel,
        count: funcionariosNivel.length,
        salarioMedio: media
      };
    });
    
    // Identificar salários fora da tabela
    const salarioForaTabela = [];
    
    // Buscar tabelas salariais
    const salaryTables = await SalaryTable.find().populate('cargo');
    
    employees.forEach(emp => {
      if (emp.cargo) {
        // Buscar tabela salarial correspondente
        const tabela = salaryTables.find(
          table => 
            table.cargo._id.toString() === emp.cargo._id.toString() && 
            table.nivel === emp.nivelCarreira
        );
        
        if (tabela) {
          // Verificar se salário está fora da tabela
          if (emp.salario < tabela.valorMinimo || emp.salario > tabela.valorMaximo) {
            salarioForaTabela.push({
              funcionario: {
                _id: emp._id,
                nome: emp.nome
              },
              cargo: emp.cargo.titulo,
              nivel: emp.nivelCarreira,
              salarioAtual: emp.salario,
              faixaMinima: tabela.valorMinimo,
              faixaMaxima: tabela.valorMaximo,
              notaAvaliacao: emp.notaAvaliacao || 0
            });
          }
        }
      }
    });
    
    // Ordenar por nota de avaliação (maior primeiro)
    salarioForaTabela.sort((a, b) => b.notaAvaliacao - a.notaAvaliacao);
    
    res.status(200).json({
      success: true,
      data: {
        salarioMedio,
        salarioPorNivel,
        salarioForaTabela
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter comparativo de orçamento
// @route   GET /api/dashboard/budget-comparison
// @access  Private
exports.getBudgetComparison = async (req, res, next) => {
  try {
    // Filtrar por departamento para gestores e business partners
    let departmentIds = [];
    if (['Gestor', 'BusinessPartner'].includes(req.user.perfil)) {
      if (req.user.departamentosGerenciados && req.user.departamentosGerenciados.length > 0) {
        departmentIds = req.user.departamentosGerenciados;
      } else {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
    }
    
    // Buscar departamentos
    let departmentFilter = {};
    if (departmentIds.length > 0) {
      departmentFilter = { _id: { $in: departmentIds } };
    }
    
    const departments = await Department.find(departmentFilter);
    
    // Calcular utilização do orçamento
    const comparison = await Promise.all(
      departments.map(async (dept) => {
        // Contar funcionários ativos
        const headcount = await Employee.countDocuments({ 
          departamento: dept._id,
          status: 'Ativo'
        });
        
        // Calcular massa salarial
        const employees = await Employee.find({
          departamento: dept._id,
          status: 'Ativo'
        });
        
        let massaSalarial = 0;
        employees.forEach(emp => {
          massaSalarial += emp.salario;
        });
        
        return {
          _id: dept._id,
          nome: dept.nome,
          centroCusto: dept.centroCusto,
          orcamento: {
            salarios: dept.orcamento?.salarios || 0,
            headcount: dept.orcamento?.headcount || 0
          },
          utilizado: {
            salarios: massaSalarial,
            headcount
          },
          percentual: {
            salarios: dept.orcamento?.salarios ? (massaSalarial / dept.orcamento.salarios) * 100 : 0,
            headcount: dept.orcamento?.headcount ? (headcount / dept.orcamento.headcount) * 100 : 0
          }
        };
      })
    );
    
    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (err) {
    next(err);
  }
};
