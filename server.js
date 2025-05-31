// server.js - Versão atualizada usando MongoDB/Mongoose
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

// Importar rotas
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const departmentRoutes = require('./routes/departments');
const positionRoutes = require('./routes/positions');
const movementRoutes = require('./routes/movements');
const salaryTableRoutes = require('./routes/salaryTables');
const dashboardRoutes = require('./routes/dashboard');

// Configurações do app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

// Configuração do MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
};

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/salary-tables', salaryTableRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota de health check
app.get('/', (req, res) => {
  res.send(`Sistema de Gestão de RH - API (Porta ${PORT})`);
});

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor rodando em http://localhost:${PORT}` );
    });

    server.on('error', (err) => {
      console.error('❌ Erro no servidor', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Falha crítica:', error);
    process.exit(1);
  }
};

// Inicia o servidor
startServer();
