const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Tenant } = require('../models');
const logger = require('../utils/logger');

// Gerar token JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      tenantId: user.tenantId,
      perfil: user.perfil
    },
    process.env.JWT_SECRET || 'sistema_rh_secret_key',
    { expiresIn: '1h' }
  );
};

// Gerar refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id,
      tokenVersion: user.tokenVersion || 0
    },
    process.env.JWT_REFRESH_SECRET || 'sistema_rh_refresh_secret_key',
    { expiresIn: '7d' }
  );
};

// Registrar nova empresa e usuário admin
exports.register = async (req, res) => {
  try {
    const { 
      empresa, 
      cnpj, 
      nome, 
      email, 
      senha,
      cargo
    } = req.body;

    // Verificar se já existe tenant com este CNPJ
    const existingTenant = await Tenant.findOne({ where: { cnpj } });
    if (existingTenant) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'CNPJ já cadastrado' 
      });
    }

    // Verificar se já existe usuário com este email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Email já cadastrado' 
      });
    }

    // Criar novo tenant
    const tenant = await Tenant.create({
      nome: empresa,
      cnpj,
      status: 'trial',
      plano: 'basic'
    });

    // Criar usuário admin
    const user = await User.create({
      tenantId: tenant.id,
      nome,
      email,
      senha, // Hash é feito automaticamente pelo hook do modelo
      cargo,
      perfil: 'admin',
      status: 'ativo'
    });

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log de registro
    logger.info('Nova empresa registrada', {
      tenantId: tenant.id,
      userId: user.id,
      empresa: tenant.nome
    });

    // Retornar dados do usuário e tokens
    return res.status(201).json({
      status: 'success',
      message: 'Registro realizado com sucesso',
      data: {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          perfil: user.perfil,
          cargo: user.cargo
        },
        tenant: {
          id: tenant.id,
          nome: tenant.nome,
          plano: tenant.plano,
          status: tenant.status
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Erro no registro', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao registrar empresa e usuário' 
    });
  }
};

// Login de usuário
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Buscar usuário pelo email
    const user = await User.findOne({ 
      where: { email },
      include: [{
        model: Tenant,
        as: 'tenant',
        attributes: ['id', 'nome', 'status', 'plano']
      }]
    });

    // Verificar se usuário existe
    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Credenciais inválidas' 
      });
    }

    // Verificar se a senha está correta
    const isPasswordValid = await user.validPassword(senha);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Credenciais inválidas' 
      });
    }

    // Verificar se o usuário está ativo
    if (user.status !== 'ativo') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Usuário inativo ou bloqueado' 
      });
    }

    // Verificar se o tenant está ativo
    if (!user.tenant || !['ativo', 'trial'].includes(user.tenant.status)) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Empresa inativa ou com acesso expirado' 
      });
    }

    // Atualizar último acesso
    await user.update({ ultimoAcesso: new Date() });

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log de login
    logger.info('Login realizado com sucesso', {
      userId: user.id,
      tenantId: user.tenantId
    });

    // Retornar dados do usuário e tokens
    return res.status(200).json({
      status: 'success',
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          perfil: user.perfil,
          cargo: user.cargo
        },
        tenant: {
          id: user.tenant.id,
          nome: user.tenant.nome,
          plano: user.tenant.plano,
          status: user.tenant.status
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error('Erro no login', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao realizar login' 
    });
  }
};

// Renovar token com refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Refresh token não fornecido' 
      });
    }

    // Verificar e decodificar o refresh token
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || 'sistema_rh_refresh_secret_key'
    );

    // Buscar usuário
    const user = await User.findOne({ 
      where: { 
        id: decoded.userId,
        status: 'ativo'
      },
      include: [{
        model: Tenant,
        as: 'tenant',
        where: {
          status: ['ativo', 'trial']
        }
      }]
    });

    if (!user) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Usuário não encontrado ou inativo' 
      });
    }

    // Verificar versão do token (para invalidação)
    if ((user.tokenVersion || 0) !== decoded.tokenVersion) {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Refresh token inválido' 
      });
    }

    // Gerar novos tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Retornar novos tokens
    return res.status(200).json({
      status: 'success',
      message: 'Token renovado com sucesso',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Refresh token expirado' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Refresh token inválido' 
      });
    }
    
    logger.error('Erro na renovação do token', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro interno na renovação do token' 
    });
  }
};

// Logout (invalidar refresh token)
exports.logout = async (req, res) => {
  try {
    // Incrementar a versão do token para invalidar tokens existentes
    await User.update(
      { 
        tokenVersion: req.user.tokenVersion ? req.user.tokenVersion + 1 : 1 
      },
      { 
        where: { id: req.user.id } 
      }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    logger.error('Erro no logout', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao realizar logout' 
    });
  }
};

// Verificar status da autenticação
exports.checkAuth = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'success',
      message: 'Usuário autenticado',
      data: {
        user: {
          id: req.user.id,
          nome: req.user.nome,
          email: req.user.email,
          perfil: req.user.perfil,
          cargo: req.user.cargo
        },
        tenant: {
          id: req.user.tenant.id,
          nome: req.user.tenant.nome,
          plano: req.user.tenant.plano,
          status: req.user.tenant.status
        }
      }
    });
  } catch (error) {
    logger.error('Erro na verificação de autenticação', { error: error.message });
    return res.status(500).json({ 
      status: 'error', 
      message: 'Erro ao verificar autenticação' 
    });
  }
};
