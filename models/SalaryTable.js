const mongoose = require('mongoose');

const SalaryTableSchema = new mongoose.Schema({
  cargo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: [true, 'Por favor, adicione um cargo']
  },
  nivel: {
    type: String,
    enum: ['Junior', 'Pleno', 'Senior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor'],
    required: [true, 'Por favor, adicione um nível']
  },
  valorMinimo: {
    type: Number,
    required: [true, 'Por favor, adicione um valor mínimo']
  },
  valorMaximo: {
    type: Number,
    required: [true, 'Por favor, adicione um valor máximo']
  },
  valorMedio: {
    type: Number,
    default: function() {
      return (this.valorMinimo + this.valorMaximo) / 2;
    }
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

module.exports = mongoose.model('SalaryTable', SalaryTableSchema);
