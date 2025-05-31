const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, adicione um nome']
  },
  email: {
    type: String,
    required: [true, 'Por favor, adicione um email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor, adicione um email válido'
    ]
  },
  senha: {
    type: String,
    required: [true, 'Por favor, adicione uma senha'],
    minlength: 6,
    select: false
  },
  perfil: {
    type: String,
    enum: ['Admin', 'BusinessPartner', 'Gestor', 'Diretor'],
    default: 'Gestor'
  },
  departamentosGerenciados: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  ativo: {
    type: Boolean,
    default: true
  },
  ultimoAcesso: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('senha')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.senha);
};

module.exports = mongoose.model('User', UserSchema);
