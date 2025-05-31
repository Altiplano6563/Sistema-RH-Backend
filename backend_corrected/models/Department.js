const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    unique: true,
    trim: true
  },
  descricao: {
    type: String
  },
  centroCusto: {
    type: String,
    required: [true, 'Por favor, adicione um centro de custo'],
    unique: true
  },
  gestor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  orcamento: {
    salarios: {
      type: Number,
      default: 0
    },
    headcount: {
      type: Number,
      default: 0
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

module.exports = mongoose.model('Department', DepartmentSchema);
