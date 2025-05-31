const mongoose = require('mongoose');

const DashboardMetricSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['contratacao', 'desligamento', 'turnover', 'orcamento', 'headcount', 'promocao', 'merito'],
    required: [true, 'Por favor, adicione um tipo de métrica']
  },
  departamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  lideranca: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  valor: {
    type: Number,
    required: [true, 'Por favor, adicione um valor']
  },
  periodo: {
    mes: {
      type: Number,
      required: [true, 'Por favor, adicione um mês'],
      min: 1,
      max: 12
    },
    ano: {
      type: Number,
      required: [true, 'Por favor, adicione um ano']
    }
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

// Índice composto para consultas rápidas por período e tipo
DashboardMetricSchema.index({ 'periodo.ano': 1, 'periodo.mes': 1, tipo: 1 });

module.exports = mongoose.model('DashboardMetric', DashboardMetricSchema);
