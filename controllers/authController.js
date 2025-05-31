const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// @desc    Registrar usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nome, email, senha, perfil } = req.body;

    // Verificar se o usuário já existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        error: 'Email já cadastrado'
      });
    }

    // Criar usuário
    user = await User.create({
      nome,
      email,
      senha,
      perfil
    });

    // Gerar tokens
    const token = user.getSignedJwtToken();
    const refreshToken = user.getRefreshToken();

    // Salvar refresh token
    await user.save();

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, senha } = req.body;

    // Verificar se o usuário existe
    const user = await User.findOne({ email }).select('+senha');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Verificar se a senha está correta
    const isMatch = await user.matchPassword(senha);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      });
    }

    // Gerar refresh token
    const refreshToken = user.getRefreshToken();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Logout de usuário
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de refresh não fornecido'
      });
    }

    // Hash do token para comparação
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Encontrar usuário com o token
    const user = await User.findOne({ refreshToken: refreshTokenHash });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: {}
      });
    }

    // Limpar token
    user.refreshToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Atualizar detalhes do usuário
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      nome: req.body.nome,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+senha');

    // Verificar senha atual
    const isMatch = await user.matchPassword(req.body.senhaAtual);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Senha atual incorreta'
      });
    }

    user.senha = req.body.novaSenha;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Esqueci minha senha
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Não há usuário com esse email'
      });
    }

    // Obter token de reset
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Em um ambiente real, enviar email com o token
    // Por enquanto, apenas retornar o token para testes
    res.status(200).json({
      success: true,
      data: {
        resetToken,
        message: 'Em um ambiente de produção, um email seria enviado com instruções para redefinir a senha'
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Redefinir senha
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Obter token hash
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    // Definir nova senha
    user.senha = req.body.senha;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Renovar token de acesso
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Token de refresh não fornecido'
      });
    }

    // Hash do token para comparação
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Encontrar usuário com o token
    const user = await User.findOne({ refreshToken: refreshTokenHash });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    // Gerar novo token de acesso
    const accessToken = user.getSignedJwtToken();

    // Gerar novo token de refresh
    const newRefreshToken = user.getRefreshToken();
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (err) {
    next(err);
  }
};

// Função auxiliar para enviar resposta com token
const sendTokenResponse = (user, statusCode, res) => {
  // Criar token
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken();

  // Remover senha da resposta
  user.senha = undefined;

  res.status(statusCode).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
};
