const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const MovementSchema = new mongoose.Schema({
  funcionario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Por favor, adicione um funcionário']
  },
  tipo: {
    type: String,
    enum: ['Promoção', 'Transferência', 'Ajuste Salarial', 'Mudança de Horário', 'Mudança de Modalidade'],
    required: [true, 'Por favor, adicione um tipo de movimentação']
  },
  cargoAnterior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position'
  },
  cargoNovo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position'
  },
  departamentoAnterior: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  departamentoNovo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  salarioAnterior: {
    type: Number
  },
  salarioNovo: {
    type: Number
  },
  justificativa: {
    type: String,
    required: [true, 'Por favor, adicione uma justificativa']
  },
  dataEfetivacao: {
    type: Date,
    required: [true, 'Por favor, adicione uma data de efetivação']
  },
  aprovadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Pendente', 'Aprovado', 'Rejeitado'],
    default: 'Pendente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Configuração para criptografia de campos sensíveis (LGPD)
const encKey = process.env.ENCRYPTION_KEY;
const sigKey = process.env.ENCRYPTION_KEY;

// Campos a serem criptografados
MovementSchema.plugin(encrypt, { 
  encryptionKey: encKey, 
  signingKey: sigKey,
  encryptedFields: ['salarioAnterior', 'salarioNovo'] 
});

module.exports = mongoose.model('Movement', MovementSchema);
