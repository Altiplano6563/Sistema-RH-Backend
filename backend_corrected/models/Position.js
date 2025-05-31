const mongoose = require('mongoose');

const PositionSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Por favor, adicione um título'],
    trim: true
  },
  descricao: {
    type: String
  },
  departamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Por favor, adicione um departamento']
  },
  faixaSalarial: {
    minimo: {
      type: Number,
      required: [true, 'Por favor, adicione um valor mínimo']
    },
    maximo: {
      type: Number,
      required: [true, 'Por favor, adicione um valor máximo']
    }
  },
  nivel: {
    type: String,
    enum: ['Junior', 'Pleno', 'Senior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor'],
    required: [true, 'Por favor, adicione um nível']
  },
  ativo: {
    type: Boolean,
    default: true
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
