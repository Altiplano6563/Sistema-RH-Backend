const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Registrar um novo usuário
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { nome, email, senha, perfil } = req.body;

    // Verificar se o usuário já existe
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        success: false,
        error: 'Usuário já existe'
      });
    }

    // Criar usuário
    user = await User.create({
      nome,
      email,
      senha,
      perfil: perfil || 'Gestor'
    });

    // Gerar token JWT
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Login de usuário
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
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

    // Verificar se o usuário está ativo
    if (!user.ativo) {
      return res.status(401).json({
        success: false,
        error: 'Usuário desativado. Entre em contato com o administrador.'
      });
    }

    // Gerar token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        perfil: user.perfil
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

// @desc    Obter usuário atual
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('departamentosGerenciados');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar detalhes do usuário
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
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
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};

// @desc    Atualizar senha
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
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

    // Gerar novo token JWT
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Erro no servidor'
    });
  }
};
