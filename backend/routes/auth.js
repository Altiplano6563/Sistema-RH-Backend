const express = require('express');
const { check } = require('express-validator');
const { register, login, getMe, updateDetails, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Rotas públicas
router.post(
  '/register',
  [
    check('nome', 'Nome é obrigatório').not().isEmpty(),
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('senha', 'Por favor, digite uma senha com 6 ou mais caracteres').isLength({ min: 6 })
  ],
  register
);

router.post(
  '/login',
  [
    check('email', 'Por favor, inclua um email válido').isEmail(),
    check('senha', 'Senha é obrigatória').exists()
  ],
  login
);

// Rotas protegidas
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
