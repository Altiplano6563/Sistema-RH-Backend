// Controlador de usuários
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const securityService = require('../services/security.service');
const config = require('../config/config');

// Listar usuários
exports.listUsers = async (req, res, next) => {
  try {
    // Verificar permissão (apenas admin pode listar todos os usuários)
    if (req.user.perfil !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    // Obter parâmetros de paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtrar por tenant do usuário logado
    const whereClause = {
      tenantId: req.user.tenantId
    };

    // Adicionar filtros adicionais se fornecidos
    if (req.query.nome) {
      whereClause.nome = { [Op.iLike]: `%${req.query.nome}%` };
    }

    if (req.query.email) {
      whereClause.email = { [Op.iLike]: `%${req.query.email}%` };
    }

    if (req.query.perfil) {
      whereClause.perfil = req.query.perfil;
    }

    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    // Buscar usuários com paginação
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['nome', 'ASC']],
      attributes: { exclude: ['senha', 'tokenVersion'] }
    });

    // Registrar acesso a dados sensíveis
    await securityService.logDataAccess(
      req.user.id,
      'usuarios',
      'listar',
      null
    );

    // Retornar resultado
    return res.json({
      status: 'success',
      data: rows,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obter usuário por ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permissão (apenas admin ou o próprio usuário)
    if (req.user.perfil !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    // Buscar usuário
    const user = await User.findOne({
      where: {
        id,
        tenantId: req.user.tenantId
      },
      attributes: { exclude: ['senha', 'tokenVersion'] }
    });

    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Registrar acesso a dados sensíveis
    await securityService.logDataAccess(
      req.user.id,
      'usuarios',
      'visualizar',
      id
    );

    // Retornar resultado
    return res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// Criar usuário
exports.createUser = async (req, res, next) => {
  try {
    // Verificar permissão (apenas admin pode criar usuários)
    if (req.user.perfil !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    const { nome, email, senha, cargo, perfil } = req.body;

    // Verificar se já existe usuário com o mesmo email no tenant
    const existingUser = await User.findOne({
      where: {
        email,
        tenantId: req.user.tenantId
      }
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'Já existe um usuário com este email'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, config.security.saltRounds);

    // Criar usuário
    const user = await User.create({
      tenantId: req.user.tenantId,
      nome,
      email,
      senha: hashedPassword,
      cargo,
      perfil: perfil || 'colaborador',
      status: 'ativo'
    });

    // Registrar criação nos logs
    logger.info('Novo usuário criado', {
      userId: user.id,
      tenantId: user.tenantId,
      createdBy: req.user.id
    });

    // Retornar resultado (sem a senha)
    const userData = user.toJSON();
    delete userData.senha;
    delete userData.tokenVersion;

    return res.status(201).json({
      status: 'success',
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar usuário
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nome, email, cargo, perfil, status } = req.body;

    // Verificar permissão (apenas admin ou o próprio usuário)
    const isAdmin = req.user.perfil === 'admin';
    const isSelf = req.user.id === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    // Buscar usuário
    const user = await User.findOne({
      where: {
        id,
        tenantId: req.user.tenantId
      }
    });

    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Preparar dados para atualização
    const updateData = {};

    // Campos que qualquer usuário pode atualizar em si mesmo
    if (nome) updateData.nome = nome;
    if (cargo) updateData.cargo = cargo;

    // Campos que apenas admin pode atualizar
    if (isAdmin) {
      if (email) updateData.email = email;
      if (perfil) updateData.perfil = perfil;
      if (status) updateData.status = status;
    }

    // Atualizar usuário
    await user.update(updateData);

    // Registrar atualização nos logs
    logger.info('Usuário atualizado', {
      userId: user.id,
      tenantId: user.tenantId,
      updatedBy: req.user.id
    });

    // Retornar resultado (sem a senha)
    const userData = user.toJSON();
    delete userData.senha;
    delete userData.tokenVersion;

    return res.json({
      status: 'success',
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

// Desativar usuário
exports.deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permissão (apenas admin pode desativar usuários)
    if (req.user.perfil !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    // Não permitir desativar o próprio usuário
    if (req.user.id === id) {
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível desativar o próprio usuário'
      });
    }

    // Buscar usuário
    const user = await User.findOne({
      where: {
        id,
        tenantId: req.user.tenantId
      }
    });

    // Verificar se o usuário existe
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Desativar usuário
    await user.update({
      status: 'inativo',
      tokenVersion: user.tokenVersion + 1 // Invalidar tokens existentes
    });

    // Registrar desativação nos logs
    logger.info('Usuário desativado', {
      userId: user.id,
      tenantId: user.tenantId,
      deactivatedBy: req.user.id
    });

    return res.json({
      status: 'success',
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Exportar dados pessoais (LGPD)
exports.exportPersonalData = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permissão (apenas admin ou o próprio usuário)
    const isAdmin = req.user.perfil === 'admin';
    const isSelf = req.user.id === id;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    // Exportar dados pessoais
    const personalData = await securityService.exportUserPersonalData(id);

    // Registrar exportação nos logs
    logger.info('Dados pessoais exportados', {
      userId: id,
      tenantId: req.user.tenantId,
      requestedBy: req.user.id
    });

    return res.json({
      status: 'success',
      data: personalData
    });
  } catch (error) {
    next(error);
  }
};

// Anonimizar dados (LGPD)
exports.anonymizeUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permissão (apenas admin)
    if (req.user.perfil !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Permissão negada'
      });
    }

    // Não permitir anonimizar o próprio usuário
    if (req.user.id === id) {
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível anonimizar o próprio usuário'
      });
    }

    // Anonimizar dados
    await securityService.anonymizeUserData(id);

    // Registrar anonimização nos logs
    logger.info('Dados de usuário anonimizados', {
      userId: id,
      tenantId: req.user.tenantId,
      requestedBy: req.user.id
    });

    return res.json({
      status: 'success',
      message: 'Dados anonimizados com sucesso'
    });
  } catch (error) {
    next(error);
  }
};
