// Modificação do arquivo server.js para forçar sincronização dos modelos
require('dotenv').config();
const app = require('./app');
const db = require('./models');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

// Função para iniciar o servidor
const startServer = async () => {
  try {
    // Testar conexão com o banco de dados
    await db.sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
    
    // Forçar sincronização dos modelos com o banco de dados (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      await db.sync({ force:true }); // Sintaxe correta do sequelize.sync()
      logger.warn('TABELAS RECRIADAS(modo desenvolvimento)');
    }
    
    // Iniciar o servidor
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor iniciado na porta ${PORT}`);
    });.on('error', (err) => {
    logger.error('FALHA AO INICIAR SERVIDOR:', err);
    process.exit(1);
  });

// Iniciar o servidor
startServer();
