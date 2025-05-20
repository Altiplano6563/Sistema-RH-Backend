// Implementação de proteções de segurança e LGPD
const crypto = require('crypto');
const { User, Employee } = require('../models');
const logger = require('../utils/logger');

class SecurityService {
  /**
   * Criptografa dados sensíveis
   * @param {string} data - Dados a serem criptografados
   * @returns {string} - Dados criptografados
   */
  encryptData(data) {
    try {
      if (!data) return null;
      
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(process.env.ENCRYPTION_KEY || 'sistema-rh-online-encryption-key-32ch', 'utf8');
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Erro ao criptografar dados', { error: error.message });
      throw error;
    }
  }

  /**
   * Descriptografa dados sensíveis
   * @param {string} encryptedData - Dados criptografados
   * @returns {string} - Dados descriptografados
   */
  decryptData(encryptedData) {
    try {
      if (!encryptedData) return null;
      
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(process.env.ENCRYPTION_KEY || 'sistema-rh-online-encryption-key-32ch', 'utf8');
      
      const parts = encryptedData.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Erro ao descriptografar dados', { error: error.message });
      throw error;
    }
  }

  /**
   * Anonimiza dados pessoais de um usuário
   * @param {string} userId - ID do usuário
   * @returns {boolean} - Sucesso da operação
   */
  async anonymizeUserData(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Gerar identificador anônimo
      const anonymousId = `anon_${crypto.randomBytes(8).toString('hex')}`;
      
      // Atualizar dados do usuário
      await user.update({
        nome: `Usuário Anonimizado ${anonymousId}`,
        email: `${anonymousId}@anonimizado.com`,
        senha: crypto.randomBytes(32).toString('hex'), // Senha aleatória inutilizável
        status: 'inativo',
        tokenVersion: user.tokenVersion + 1 // Invalidar tokens existentes
      });
      
      logger.info('Dados de usuário anonimizados', { userId });
      
      return true;
    } catch (error) {
      logger.error('Erro ao anonimizar dados de usuário', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Anonimiza dados pessoais de um colaborador
   * @param {string} employeeId - ID do colaborador
   * @returns {boolean} - Sucesso da operação
   */
  async anonymizeEmployeeData(employeeId) {
    try {
      const employee = await Employee.findByPk(employeeId);
      
      if (!employee) {
        throw new Error('Colaborador não encontrado');
      }
      
      // Gerar identificador anônimo
      const anonymousId = `anon_${crypto.randomBytes(8).toString('hex')}`;
      
      // Atualizar dados do colaborador
      await employee.update({
        nome: `Colaborador Anonimizado ${anonymousId}`,
        email: `${anonymousId}@anonimizado.com`,
        cpf: `000.000.000-00`,
        dataNascimento: null,
        genero: 'nao_informado',
        telefone: null,
        endereco: null,
        status: 'inativo'
      });
      
      logger.info('Dados de colaborador anonimizados', { employeeId });
      
      return true;
    } catch (error) {
      logger.error('Erro ao anonimizar dados de colaborador', { error: error.message, employeeId });
      throw error;
    }
  }

  /**
   * Exporta dados pessoais de um usuário (LGPD)
   * @param {string} userId - ID do usuário
   * @returns {Object} - Dados pessoais do usuário
   */
  async exportUserPersonalData(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Buscar colaborador associado, se existir
      const employee = await Employee.findOne({
        where: { email: user.email, tenantId: user.tenantId }
      });
      
      // Preparar dados pessoais
      const personalData = {
        usuario: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          cargo: user.cargo,
          perfil: user.perfil,
          status: user.status,
          dataCriacao: user.dataCriacao,
          ultimoAcesso: user.ultimoAcesso
        }
      };
      
      // Adicionar dados de colaborador, se existir
      if (employee) {
        personalData.colaborador = {
          id: employee.id,
          nome: employee.nome,
          email: employee.email,
          cpf: employee.cpf,
          dataNascimento: employee.dataNascimento,
          genero: employee.genero,
          telefone: employee.telefone,
          endereco: employee.endereco,
          departamentoId: employee.departamentoId,
          cargoId: employee.cargoId,
          dataAdmissao: employee.dataAdmissao,
          dataDemissao: employee.dataDemissao,
          modalidadeTrabalho: employee.modalidadeTrabalho,
          cargaHoraria: employee.cargaHoraria,
          status: employee.status
        };
      }
      
      logger.info('Dados pessoais exportados', { userId });
      
      return personalData;
    } catch (error) {
      logger.error('Erro ao exportar dados pessoais', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Registra consentimento do usuário para coleta de dados
   * @param {string} userId - ID do usuário
   * @param {Object} consentData - Dados de consentimento
   * @returns {boolean} - Sucesso da operação
   */
  async registerConsent(userId, consentData) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Criar registro de consentimento
      const { Consent } = require('../models');
      await Consent.create({
        userId,
        tenantId: user.tenantId,
        tipoConsentimento: consentData.tipo,
        descricao: consentData.descricao,
        consentimento: consentData.consentimento,
        dataConsentimento: new Date(),
        ipAddress: consentData.ipAddress,
        userAgent: consentData.userAgent
      });
      
      logger.info('Consentimento registrado', { userId, tipo: consentData.tipo });
      
      return true;
    } catch (error) {
      logger.error('Erro ao registrar consentimento', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Verifica se há consentimento do usuário para determinado tipo de coleta
   * @param {string} userId - ID do usuário
   * @param {string} tipoConsentimento - Tipo de consentimento
   * @returns {boolean} - Se há consentimento
   */
  async hasConsent(userId, tipoConsentimento) {
    try {
      // Buscar consentimento mais recente
      const { Consent } = require('../models');
      const consent = await Consent.findOne({
        where: {
          userId,
          tipoConsentimento
        },
        order: [['dataConsentimento', 'DESC']]
      });
      
      return consent ? consent.consentimento : false;
    } catch (error) {
      logger.error('Erro ao verificar consentimento', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Registra acesso a dados sensíveis (auditoria LGPD)
   * @param {string} userId - ID do usuário que acessou
   * @param {string} recurso - Recurso acessado
   * @param {string} operacao - Operação realizada
   * @param {string} alvoId - ID do alvo da operação
   * @returns {boolean} - Sucesso da operação
   */
  async logDataAccess(userId, recurso, operacao, alvoId) {
    try {
      // Criar registro de acesso
      const { DataAccessLog } = require('../models');
      await DataAccessLog.create({
        userId,
        recurso,
        operacao,
        alvoId,
        dataAcesso: new Date(),
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent()
      });
      
      return true;
    } catch (error) {
      logger.error('Erro ao registrar acesso a dados', { error: error.message, userId });
      return false;
    }
  }

  /**
   * Obtém endereço IP do cliente (para uso em middleware)
   * @returns {string} - Endereço IP
   */
  getClientIp(req) {
    return req.ip || 
           (req.headers['x-forwarded-for'] || '').split(',')[0] || 
           req.connection.remoteAddress;
  }

  /**
   * Obtém User-Agent do cliente (para uso em middleware)
   * @returns {string} - User-Agent
   */
  getUserAgent(req) {
    return req.headers['user-agent'] || 'Unknown';
  }

  /**
   * Middleware para registrar acesso a dados sensíveis
   * @param {string} recurso - Recurso acessado
   * @param {string} operacao - Operação realizada
   * @returns {Function} - Middleware
   */
  auditAccessMiddleware(recurso, operacao) {
    return async (req, res, next) => {
      try {
        // Obter ID do usuário do token JWT
        const userId = req.user ? req.user.id : null;
        
        if (!userId) {
          return next();
        }
        
        // Obter ID do alvo da operação
        const alvoId = req.params.id || req.body.id || null;
        
        // Registrar acesso
        await this.logDataAccess(
          userId,
          recurso,
          operacao,
          alvoId,
          this.getClientIp(req),
          this.getUserAgent(req)
        );
        
        next();
      } catch (error) {
        // Não bloquear a requisição em caso de erro no log
        logger.error('Erro no middleware de auditoria', { error: error.message });
        next();
      }
    };
  }

  /**
   * Middleware para verificar consentimento
   * @param {string} tipoConsentimento - Tipo de consentimento
   * @returns {Function} - Middleware
   */
  checkConsentMiddleware(tipoConsentimento) {
    return async (req, res, next) => {
      try {
        // Obter ID do usuário do token JWT
        const userId = req.user ? req.user.id : null;
        
        if (!userId) {
          return res.status(401).json({
            status: 'error',
            message: 'Usuário não autenticado'
          });
        }
        
        // Verificar consentimento
        const hasConsent = await this.hasConsent(userId, tipoConsentimento);
        
        if (!hasConsent) {
          return res.status(403).json({
            status: 'error',
            message: 'Consentimento não fornecido para esta operação',
            consentRequired: tipoConsentimento
          });
        }
        
        next();
      } catch (error) {
        logger.error('Erro no middleware de consentimento', { error: error.message });
        return res.status(500).json({
          status: 'error',
          message: 'Erro ao verificar consentimento'
        });
      }
    };
  }
}

module.exports = new SecurityService();
