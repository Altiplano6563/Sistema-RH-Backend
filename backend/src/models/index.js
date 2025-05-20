const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const logger = require('../utils/logger');
const dbConfig = require('../config/database');

// Determinar ambiente atual
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

logger.info(`Inicializando banco de dados no ambiente: ${env}`);

// Inicialização do Sequelize com base na configuração do ambiente
let sequelize;
if (config.dialect === 'sqlite') {
  logger.info('Usando SQLite para ambiente de desenvolvimento/teste');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: config.storage,
    logging: msg => logger.debug(msg),
    define: config.define
  });
} else {
  logger.info(`Conectando ao banco ${config.dialect} em ${config.host}:${config.port}`);
  sequelize = new Sequelize(
    config.database || process.env.DB_NAME,
    config.username || process.env.DB_USER,
    config.password || process.env.DB_PASSWORD,
    {
      host: config.host || process.env.DB_HOST,
      port: config.port || process.env.DB_PORT,
      dialect: config.dialect,
      logging: msg => logger.debug(msg),
      dialectOptions: config.dialectOptions,
      pool: config.pool,
      define: config.define
    }
  );
}

// Objeto para armazenar os modelos
const db = {};

// Carregamento automático de todos os modelos
const modelsDir = path.join(__dirname);
fs.readdirSync(modelsDir)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-9) === '.model.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(modelsDir, file))(sequelize);
    db[model.name] = model;
  });

// Configuração das associações entre modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Exportação do objeto db com todos os modelos e instância do Sequelize
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Função para sincronizar modelos com o banco de dados
db.sync = async (force = false) => {
  try {
    logger.info(`Sincronizando modelos com o banco de dados (force: ${force})`);
    await sequelize.sync({ force });
    logger.info('Sincronização concluída com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao sincronizar modelos com o banco de dados', { error });
    throw error;
  }
};

module.exports = db;
