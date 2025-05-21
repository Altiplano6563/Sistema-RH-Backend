const { Movement, Employee, User, Department, Position, Tenant } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Listar movimentações
exports.getMovements = async (req, res) => {
  try {
    const { colaboradorId, tipo, status, dataInicio, dataFim } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Construir condições de busca
    const where = { tenantId: req.tenantId };
    
    if (colaboradorId) {
      where.colaboradorId = colaboradorId;
    }
    
    if (tipo) {
      where.tipo = tipo;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Filtro por período
    if (dataInicio || dataFim) {
      where.dataEfetivacao = {};
      
      if (dataInicio) {
        where.dataEfetivacao[Op.gte] = new Date(dataInicio);
      }
      
      if (dataFim) {
        where.dataEfetivacao[Op.lte] = new Date(dataFim);
      }
    }
    
    // Buscar movimentações com paginação
    const { count, rows } = await Movement.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          as: 'colaborador',
          attributes: ['id', 'nome']
        },
        {
          model: User,
          as: 'aprovador',
          attributes: ['id', 'nome']
        }
      ],
      order: [['dataEfetivacao', 'DESC']],
      limit,
      offset
    });
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(count / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    return res.status(200).json({
      status: 'success',
      message: 'Movimentações listadas com sucesso',
      data: {
        movimentacoes: rows,
        pagination: {
          total: count,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev
        }
      }
    });
  } catch (error) {
    logger.error('Erro ao listar movimentações', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao listar movimentações' 
    });
  }
};

// Obter movimentação por ID
exports.getMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar movimentação com detalhes
    const movement = await Movement.findOne({
      where: { 
        id,
        tenantId: req.tenantId
      },
      include: [
        {
          model: Employee,
          as: 'colaborador',
          attributes: ['id', 'nome', 'email']
        },
        {
          model: User,
          as: 'aprovador',
          attributes: ['id', 'nome', 'email']
        }
      ]
    });
    
    if (!movement) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Movimentação não encontrada' 
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Movimentação encontrada com sucesso',
      data: {
        movimentacao: movement
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar movimentação', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao buscar movimentação' 
    });
  }
};

// Criar nova movimentação
exports.createMovement = async (req, res) => {
  try {
    const {
      colaboradorId,
      tipo,
      dataEfetivacao,
      valorAnterior,
      valorNovo,
      motivo,
      observacoes
    } = req.body;
    
    // Verificar se colaborador existe
    const employee = await Employee.findOne({
      where: { 
        id: colaboradorId,
        tenantId: req.tenantId
      }
    });
    
    if (!employee) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Colaborador não encontrado' 
      });
    }
    
    // Validar tipo de movimentação
    const tiposValidos = ['promocao', 'transferencia', 'merito', 'equiparacao', 'modalidade', 'cargaHoraria'];
    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Tipo de movimentação inválido' 
      });
    }
    
    // Validar valores anterior e novo
    if (!valorAnterior || !valorNovo) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Valores anterior e novo são obrigatórios' 
      });
    }
    
    // Criar nova movimentação
    const movement = await Movement.create({
      tenantId: req.tenantId,
      colaboradorId,
      tipo,
      dataEfetivacao,
      valorAnterior,
      valorNovo,
      motivo,
      observacoes,
      status: 'pendente'
    });
    
    // Se o usuário for admin ou RH, aprovar automaticamente
    if (['admin', 'rh'].includes(req.user.perfil)) {
      await movement.update({
        aprovadorId: req.user.id,
        status: 'aprovado'
      });
      
      // Atualizar dados do colaborador conforme o tipo de movimentação
      await atualizarColaboradorAposMovimentacao(employee, movement);
    }
    
    return res.status(201).json({
      status: 'success',
      message: 'Movimentação criada com sucesso',
      data: {
        movimentacao: movement
      }
    });
  } catch (error) {
    logger.error('Erro ao criar movimentação', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao criar movimentação' 
    });
  }
};

// Aprovar movimentação
exports.approveMovement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar movimentação
    const movement = await Movement.findOne({
      where: { 
        id,
        tenantId: req.tenantId,
        status: 'pendente'
      },
      include: [
        {
          model: Employee,
          as: 'colaborador'
        }
      ]
    });
    
    if (!movement) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Movimentação não encontrada ou já processada' 
      });
    }
    
    // Atualizar movimentação
    await movement.update({
      aprovadorId: req.user.id,
      status: 'aprovado'
    });
    
    // Atualizar dados do colaborador conforme o tipo de movimentação
    await atualizarColaboradorAposMovimentacao(movement.colaborador, movement);
    
    return res.status(200).json({
      status: 'success',
      message: 'Movimentação aprovada com sucesso',
      data: {
        movimentacao: movement
      }
    });
  } catch (error) {
    logger.error('Erro ao aprovar movimentação', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao aprovar movimentação' 
    });
  }
};

// Rejeitar movimentação
exports.rejectMovement = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivoRejeicao } = req.body;
    
    // Buscar movimentação
    const movement = await Movement.findOne({
      where: { 
        id,
        tenantId: req.tenantId,
        status: 'pendente'
      }
    });
    
    if (!movement) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Movimentação não encontrada ou já processada' 
      });
    }
    
    // Atualizar movimentação
    await movement.update({
      aprovadorId: req.user.id,
      status: 'rejeitado',
      observacoes: motivoRejeicao ? 
        (movement.observacoes ? `${movement.observacoes}\n\nMotivo da rejeição: ${motivoRejeicao}` : `Motivo da rejeição: ${motivoRejeicao}`) : 
        movement.observacoes
    });
    
    return res.status(200).json({
      status: 'success',
      message: 'Movimentação rejeitada com sucesso',
      data: {
        movimentacao: movement
      }
    });
  } catch (error) {
    logger.error('Erro ao rejeitar movimentação', { error: error.message, id: req.params.id });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao rejeitar movimentação' 
    });
  }
};

// Função auxiliar para atualizar dados do colaborador após aprovação de movimentação
async function atualizarColaboradorAposMovimentacao(employee, movement) {
  try {
    const updateData = {};
    
    switch (movement.tipo) {
      case 'promocao':
        // Atualizar cargo e salário
        updateData.cargoId = movement.valorNovo.cargoId;
        updateData.salario = movement.valorNovo.salario;
        break;
        
      case 'transferencia':
        // Atualizar departamento
        updateData.departamentoId = movement.valorNovo.departamentoId;
        break;
        
      case 'merito':
      case 'equiparacao':
        // Atualizar salário
        updateData.salario = movement.valorNovo.salario;
        break;
        
      case 'modalidade':
        // Atualizar modalidade de trabalho
        updateData.modalidadeTrabalho = movement.valorNovo.modalidadeTrabalho;
        break;
        
      case 'cargaHoraria':
        // Atualizar carga horária
        updateData.cargaHoraria = movement.valorNovo.cargaHoraria;
        break;
    }
    
    // Atualizar colaborador se houver dados para atualizar
    if (Object.keys(updateData).length > 0) {
      await employee.update(updateData);
    }
  } catch (error) {
    logger.error('Erro ao atualizar colaborador após movimentação', { 
      error: error.message, 
      employeeId: employee.id,
      movementId: movement.id
    });
    throw error;
  }
}
