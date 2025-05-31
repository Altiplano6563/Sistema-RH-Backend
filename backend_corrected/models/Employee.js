const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const EmployeeSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Por favor, adicione um nome'],
    trim: true
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
  cpf: {
    type: String,
    required: [true, 'Por favor, adicione um CPF'],
    unique: true
  },
  dataNascimento: {
    type: Date,
    required: [true, 'Por favor, adicione uma data de nascimento']
  },
  telefone: {
    type: String
  },
  departamento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Por favor, adicione um departamento']
  },
  cargo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: [true, 'Por favor, adicione um cargo']
  },
  liderancaDireta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  status: {
    type: String,
    enum: ['Ativo', 'Inativo', 'Afastado', 'Férias', 'Licença Maternidade'],
    default: 'Ativo'
  },
  dataContratacao: {
    type: Date,
    required: [true, 'Por favor, adicione uma data de contratação']
  },
  salario: {
    type: Number,
    required: [true, 'Por favor, adicione um salário']
  },
  cargaHoraria: {
    type: Number,
    required: [true, 'Por favor, adicione uma carga horária'],
    enum: [150, 180, 200, 220]
  },
  horarioTrabalho: {
    type: String
  },
  modalidadeTrabalho: {
    type: String,
    enum: ['Presencial', 'Remoto', 'Híbrido'],
    default: 'Presencial'
  },
  genero: {
    type: String,
    enum: ['Masculino', 'Feminino', 'Não Binário', 'Prefiro não informar']
  },
  raca: {
    type: String,
    enum: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar']
  },
  localidade: {
    cidade: String,
    estado: String,
    pais: {
      type: String,
      default: 'Brasil'
    }
  },
  nivelCarreira: {
    type: String,
    enum: ['Junior', 'Pleno', 'Senior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor']
  },
  notaAvaliacao: {
    type: Number,
    min: 0,
    max: 10
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
EmployeeSchema.plugin(encrypt, { 
  encryptionKey: encKey, 
  signingKey: sigKey,
  encryptedFields: ['cpf', 'dataNascimento', 'salario'] 
});

module.exports = mongoose.model('Employee', EmployeeSchema);
