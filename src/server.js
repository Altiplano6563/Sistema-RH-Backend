// Modificação do arquivo server.js para forçar sincronização dos modelos
require('dotenv').config();
const express = require('express');
const { Sequelize } = require('sequelize');
const logger = require('./utils/logger'); // Remova se não tiver

// Configuração do Express
const app = express();
app.use(express.json());

// Conexão com o PostgreSQL
(Railway)
const sequelize = new Sequelize(process.env.DATABASE_URL,
  {
    dialect: 'postgre',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necessário para o Railway
      }
    }
  });

  //Middleware de health check
  app.get('/health', (req,res) => {
    res.status(200).json({ status: 'OK' });
  })/

  // Inicialização segura
  const startServer = async () => {
    try {
      // Testar conexão com o banco
      await sequelize.authenticate();
      logger.info('✅ Banco de dados conectado');

      // Sincronizar modelos (apenas em dev)
      if (process.env.NODE_ENV !== 'PRODUCTION') {
        await sequelize.sync({ force:false });
        logger.warn('⚠️ Modo desenvolvimento: tabelas sincronizadas');
      }

      // Iniciar servidor
      const PORT = process.env.PORT || 3001;
            app.listen(PORT, '0.0.0.0', () => {
              logger.info('🚀 Servidor rodando na porta ${PORT}`);
              }).on('error', (err) => {
                logger.error('💥 ERRO NO SERVIDOR:', err);
                process.exit(1);
                });

              } catch (error) {
                logger.error('❌ Falha crítica:', error);
                process.exit(1);
              }
            };

startServer();
