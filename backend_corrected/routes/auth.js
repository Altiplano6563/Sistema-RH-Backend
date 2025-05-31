const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect } = require('../middleware/auth');
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Registrar usuário
// @access  Public
router.post(
  '/register',
  [
    check('nome', 'Nome é obrigatório').not().isEmpty(),
    check('email', 'Email válido é obrigatório').isEmail(),
    check('senha', 'Senha deve ter pelo menos 6 caracteres').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Login de usuário
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Email válido é obrigatório').isEmail(),
    check('senha', 'Senha é obrigatória').exists()
  ],
  authController.login
);

// @route   POST /api/auth/logout
// @desc    Logout de usuário
// @access  Private
router.post('/logout', authController.logout);

// @route   GET /api/auth/me
// @desc    Obter usuário atual
// @access  Private
router.get('/me', protect, authController.getMe);

// @route   PUT /api/auth/updatedetails
// @desc    Atualizar detalhes do usuário
// @access  Private
router.put('/updatedetails', protect, authController.updateDetails);

// @route   PUT /api/auth/updatepassword
// @desc    Atualizar senha
// @access  Private
router.put(
  '/updatepassword',
  [
    protect,
    check('senhaAtual', 'Senha atual é obrigatória').exists(),
    check('novaSenha', 'Nova senha deve ter pelo menos 6 caracteres').isLength({ min: 6 })
  ],
  authController.updatePassword
);

// @route   POST /api/auth/forgotpassword
// @desc    Esqueci minha senha
// @access  Public
router.post(
  '/forgotpassword',
  [
    check('email', 'Email válido é obrigatório').isEmail()
  ],
  authController.forgotPassword
);

// @route   PUT /api/auth/resetpassword/:resettoken
// @desc    Redefinir senha
// @access  Public
router.put(
  '/resetpassword/:resettoken',
  [
    check('senha', 'Senha deve ter pelo menos 6 caracteres').isLength({ min: 6 })
  ],
  authController.resetPassword
);

// @route   POST /api/auth/refresh-token
// @desc    Renovar token de acesso
// @access  Public
router.post(
  '/refresh-token',
  [
    check('refreshToken', 'Token de refresh é obrigatório').exists()
  ],
  authController.refreshToken
);

module.exports = router;
