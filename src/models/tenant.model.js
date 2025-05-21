const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: Sequelize.STRING,
      allowNull: false
    },
    razaoSocial: {
      type: Sequelize.STRING,
      allowNull: false
    },
    cnpj: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false
    },
    telefone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('ativo', 'inativo', 'suspenso'),
      defaultValue: 'ativo'
    },
    plano: {
      type: Sequelize.ENUM('basico', 'intermediario', 'avancado'),
      defaultValue: 'basico'
    },
    dataExpiracao: {
      type: Sequelize.DATE,
      allowNull: true
    }
  }, {
    tableName: 'tenants',
    timestamps: true,
    paranoid: true // Soft delete
  });

  Tenant.associate = (models) => {
    Tenant.hasMany(models.User, {
      foreignKey: 'tenantId',
      as: 'usuarios'
    });
    
    Tenant.hasMany(models.Department, {
      foreignKey: 'tenantId',
      as: 'departamentos'
    });
    
    Tenant.hasMany(models.Position, {
      foreignKey: 'tenantId',
      as: 'cargos'
    });
    
    Tenant.hasMany(models.Employee, {
      foreignKey: 'tenantId',
      as: 'colaboradores'
    });
  };

  return Tenant;
};
