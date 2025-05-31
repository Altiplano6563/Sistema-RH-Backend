const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    nome: {
      type: Sequelize.STRING,
      allowNull: false
    },
    descricao: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    responsavelId: {
      type: Sequelize.UUID,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('ativo', 'inativo'),
      defaultValue: 'ativo'
    },
    tenantId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'nome']
      }
    ]
  });

  Department.associate = (models) => {
    Department.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    
    Department.belongsTo(models.Employee, {
      foreignKey: 'responsavelId',
      as: 'responsavel'
    });
    
    Department.hasMany(models.Employee, {
      foreignKey: 'departamentoId',
      as: 'colaboradores'
    });
  };

  return Department;
};
