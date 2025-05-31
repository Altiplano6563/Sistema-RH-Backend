const mongoose = require('mongoose');

const SalaryTableSchema = new mongoose.Schema({
  cargo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: [true, 'Por favor, adicione um cargo']
  },
  nivel: {
    type: String,
    enum: ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor'],
    required: [true, 'Por favor, adicione um nível']
  },
  valorMinimo: {
    type: Number,
    required: [true, 'Por favor, adicione um valor mínimo']
  },
  valorMedio: {
    type: Number,
    required: [true, 'Por favor, adicione um valor médio']
  },
  valorMaximo: {
    type: Number,
    required: [true, 'Por favor, adicione um valor máximo']
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

module.exports = mongoose.model('SalaryTable', SalaryTableSchema);
