const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    senha: {
      type: Sequelize.STRING,
      allowNull: false
    },
    cargo: {
      type: Sequelize.STRING,
      allowNull: true
    },
    perfil: {
      type: Sequelize.ENUM('admin', 'gestor', 'colaborador'),
      defaultValue: 'colaborador'
    },
    status: {
      type: Sequelize.ENUM('ativo', 'inativo', 'bloqueado'),
      defaultValue: 'ativo'
    },
    tokenVersion: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    ultimoAcesso: {
      type: Sequelize.DATE,
      allowNull: true
    },
    tenantId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'email']
      }
    ]
  });

  User.associate = (models) => {
    User.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
  };

  return User;
};
