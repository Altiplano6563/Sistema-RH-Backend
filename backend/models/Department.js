const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    unique: true,
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  centroCusto: {
    type: String,
    required: [true, 'Por favor, adicione um centro de custo'],
    trim: true
  },
  orcamento: {
    type: Number,
    required: [true, 'Por favor, adicione um orçamento']
  },
  gestor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  businessPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
