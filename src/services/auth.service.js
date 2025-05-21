// Implementação do serviço de autenticação com JWT e refresh tokens
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Tenant } = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Gera tokens de acesso e refresh para um usuário
   * @param {Object} user - Objeto do usuário
   * @returns {Object} - Tokens gerados
   */
  generateTokens(user) {
    // Payload do token com informações essenciais
    const payload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      perfil: user.perfil,
      tokenVersion: user.tokenVersion
    };

    // Gerar token de acesso (curta duração)
    const accessToken = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Gerar refresh token (longa duração)
    const refreshToken = jwt.sign(
      payload,
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Realiza login do usuário
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @param {string} tenantId - ID do tenant (opcional)
   * @returns {Object} - Dados do usuário e tokens
   */
  async login(email, senha, tenantId = null) {
    try {
      // Buscar usuário pelo email
      const whereClause = { email };
      
      // Se tenantId for fornecido, adicionar à busca
      if (tenantId) {
        whereClause.tenantId = tenantId;
      }
      
      const user = await User.findOne({
        where: whereClause,
        include: [{
          model: Tenant,
          as: 'tenant',
          where: {
            status: ['ativo', 'trial']
          }
        }]
      });

      // Verificar se o usuário existe
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar se o usuário está ativo
      if (user.status !== 'ativo') {
        throw new Error('Usuário inativo ou bloqueado');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(senha, user.senha);
      if (!isPasswordValid) {
        throw new Error('Senha inválida');
      }

      // Gerar tokens
      const tokens = this.generateTokens(user);

      // Atualizar último acesso
      await user.update({ ultimoAcesso: new Date() });

      // Registrar login nos logs (com mascaramento de dados sensíveis)
      logger.info('Login realizado com sucesso', {
        userId: user.id,
        tenantId: user.tenantId,
        perfil: user.perfil
      });

      // Retornar dados do usuário e tokens
      return {
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          perfil: user.perfil,
          cargo: user.cargo,
          tenantId: user.tenantId,
          tenant: {
            id: user.tenant.id,
            nome: user.tenant.nome,
            plano: user.tenant.plano
          }
        },
        ...tokens
      };
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro no login', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Renova tokens usando refresh token
   * @param {string} refreshToken - Refresh token atual
   * @returns {Object} - Novos tokens
   */
  async refreshTokens(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      // Buscar usuário
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          status: 'ativo',
          tokenVersion: decoded.tokenVersion
        },
        include: [{
          model: Tenant,
          as: 'tenant',
          where: {
            status: ['ativo', 'trial']
          }
        }]
      });

      // Verificar se o usuário existe
      if (!user) {
        throw new Error('Usuário não encontrado ou inativo');
      }

      // Gerar novos tokens
      const tokens = this.generateTokens(user);

      // Registrar refresh nos logs
      logger.info('Tokens renovados com sucesso', {
        userId: user.id,
        tenantId: user.tenantId
      });

      return tokens;
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro na renovação de tokens', { error: error.message });
      throw error;
    }
  }

  /**
   * Invalida o refresh token do usuário
   * @param {string} userId - ID do usuário
   * @returns {boolean} - Sucesso da operação
   */
  async logout(userId) {
    try {
      // Buscar usuário
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Incrementar versão do token para invalidar tokens existentes
      await user.update({
        tokenVersion: user.tokenVersion + 1
      });

      // Registrar logout nos logs
      logger.info('Logout realizado com sucesso', {
        userId: user.id,
        tenantId: user.tenantId
      });

      return true;
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro no logout', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Registra uma nova empresa e usuário administrador
   * @param {Object} tenantData - Dados da empresa
   * @param {Object} userData - Dados do usuário administrador
   * @returns {Object} - Dados da empresa e usuário criados
   */
  async register(tenantData, userData) {
    try {
      // Iniciar transação para garantir consistência
      const transaction = await Tenant.sequelize.transaction();

      try {
        // Criar tenant
        const tenant = await Tenant.create({
          nome: tenantData.nome,
          cnpj: tenantData.cnpj,
          plano: tenantData.plano || 'basic',
          status: 'trial',
          dataExpiracao: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias de trial
        }, { transaction });

        // Hash da senha
        const hashedPassword = await bcrypt.hash(userData.senha, config.security.saltRounds);

        // Criar usuário administrador
        const user = await User.create({
          tenantId: tenant.id,
          nome: userData.nome,
          email: userData.email,
          senha: hashedPassword,
          cargo: userData.cargo || 'Administrador',
          perfil: 'admin',
          status: 'ativo'
        }, { transaction });

        // Commit da transação
        await transaction.commit();

        // Gerar tokens
        const tokens = this.generateTokens(user);

        // Registrar registro nos logs
        logger.info('Nova empresa e administrador registrados', {
          tenantId: tenant.id,
          userId: user.id
        });

        // Retornar dados criados e tokens
        return {
          tenant: {
            id: tenant.id,
            nome: tenant.nome,
            plano: tenant.plano,
            status: tenant.status
          },
          user: {
            id: user.id,
            nome: user.nome,
            email: user.email,
            perfil: user.perfil,
            cargo: user.cargo
          },
          ...tokens
        };
      } catch (error) {
        // Rollback em caso de erro
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro no registro de empresa', { 
        error: error.message, 
        tenantNome: tenantData.nome,
        userEmail: userData.email 
      });
      throw error;
    }
  }

  /**
   * Verifica se o token é válido
   * @param {string} token - Token de acesso
   * @returns {Object} - Dados do usuário
   */
  async verifyToken(token) {
    try {
      // Verificar token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Buscar usuário
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          status: 'ativo',
          tokenVersion: decoded.tokenVersion
        },
        include: [{
          model: Tenant,
          as: 'tenant',
          where: {
            status: ['ativo', 'trial']
          }
        }]
      });

      // Verificar se o usuário existe
      if (!user) {
        throw new Error('Usuário não encontrado ou inativo');
      }

      // Retornar dados do usuário
      return {
        id: user.id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil,
        cargo: user.cargo,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          nome: user.tenant.nome,
          plano: user.tenant.plano
        }
      };
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro na verificação de token', { error: error.message });
      throw error;
    }
  }

  /**
   * Altera a senha do usuário
   * @param {string} userId - ID do usuário
   * @param {string} senhaAtual - Senha atual
   * @param {string} novaSenha - Nova senha
   * @returns {boolean} - Sucesso da operação
   */
  async changePassword(userId, senhaAtual, novaSenha) {
    try {
      // Buscar usuário
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha);
      if (!isPasswordValid) {
        throw new Error('Senha atual inválida');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(novaSenha, config.security.saltRounds);

      // Atualizar senha e incrementar versão do token
      await user.update({
        senha: hashedPassword,
        tokenVersion: user.tokenVersion + 1
      });

      // Registrar alteração de senha nos logs
      logger.info('Senha alterada com sucesso', {
        userId: user.id,
        tenantId: user.tenantId
      });

      return true;
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro na alteração de senha', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Inicia processo de recuperação de senha
   * @param {string} email - Email do usuário
   * @returns {boolean} - Sucesso da operação
   */
  async forgotPassword(email) {
    try {
      // Buscar usuário pelo email
      const user = await User.findOne({
        where: { email, status: 'ativo' }
      });

      // Verificar se o usuário existe
      if (!user) {
        // Por segurança, não informamos se o email existe ou não
        return true;
      }

      // Gerar token de recuperação (válido por 1 hora)
      const resetToken = jwt.sign(
        { userId: user.id, tokenVersion: user.tokenVersion },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      // TODO: Enviar email com link de recuperação
      // Implementar serviço de email

      // Registrar solicitação nos logs
      logger.info('Solicitação de recuperação de senha', {
        userId: user.id,
        tenantId: user.tenantId
      });

      return true;
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro na solicitação de recuperação de senha', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Redefine a senha do usuário usando token de recuperação
   * @param {string} token - Token de recuperação
   * @param {string} novaSenha - Nova senha
   * @returns {boolean} - Sucesso da operação
   */
  async resetPassword(token, novaSenha) {
    try {
      // Verificar token
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Buscar usuário
      const user = await User.findOne({
        where: {
          id: decoded.userId,
          status: 'ativo',
          tokenVersion: decoded.tokenVersion
        }
      });

      // Verificar se o usuário existe
      if (!user) {
        throw new Error('Token inválido ou expirado');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(novaSenha, config.security.saltRounds);

      // Atualizar senha e incrementar versão do token
      await user.update({
        senha: hashedPassword,
        tokenVersion: user.tokenVersion + 1
      });

      // Registrar redefinição de senha nos logs
      logger.info('Senha redefinida com sucesso', {
        userId: user.id,
        tenantId: user.tenantId
      });

      return true;
    } catch (error) {
      // Registrar erro nos logs
      logger.error('Erro na redefinição de senha', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AuthService();
