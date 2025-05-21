// Modificação do arquivo server.js para forçar sincronização dos modelos
require('dotenv').config();
const express = require('express');
const { Sequelize } =
require('sequelize');

// Configurações do app
const app = express();
const PORT = process.env.PORT || 3981;

// Configuração do Sequelize
const sequelize = new Sequelize(process.env.DATABASE_URL,
  {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });

  // Middleware básico
  app.use(express.json());

  // Rota de health check
  app.get('/', (req, res) => {
    res.send(`servidor RH Online (Porta ${PORT})`);
  });

  // Função para iniciar o servidor
  (async function startServer() {
    try {
      await sequelize.authenticate();
      console.log('✅ Banco de dados conectado');

      if (process.env.NODE_ENV !== 'production') {
        await sequelize.sync({ force:false });
      }

            app.listen(PORT, '0.0.0.0', () => {
              console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
              });
            }catch (error) {
                console.error('💥 Falha crítica', error);
                process.exit(1);
                }
              }

//Inicia o servidor
startServer();
