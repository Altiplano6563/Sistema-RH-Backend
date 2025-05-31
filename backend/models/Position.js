const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  departamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Por favor, adicione um departamento']
  },
  senioridadeMinima: {
    type: String,
    enum: ['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor'],
    default: 'Júnior'
  },
  requisitosMinimos: {
    type: [String]
  },
  competenciasNecessarias: {
    type: [String]
  },
  faixaSalarialMinima: {
    type: Number,
    required: [true, 'Por favor, adicione uma faixa salarial mínima']
  },
  faixaSalarialMaxima: {
    type: Number,
    required: [true, 'Por favor, adicione uma faixa salarial máxima']
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

module.exports = mongoose.model('Position', PositionSchema);
