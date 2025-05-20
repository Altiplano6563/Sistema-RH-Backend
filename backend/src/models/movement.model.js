const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const Movement = sequelize.define('Movement', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    tipo: {
      type: Sequelize.ENUM('promocao', 'transferencia', 'merito', 'equiparacao', 'modalidade', 'cargaHoraria'),
      allowNull: false
    },
    colaboradorId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    dataEfetivacao: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    motivo: {
      type: Sequelize.STRING,
      allowNull: false
    },
    observacoes: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    valorAnterior: {
      type: Sequelize.JSON,
      allowNull: true
    },
    valorNovo: {
      type: Sequelize.JSON,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM('pendente', 'aprovado', 'rejeitado'),
      defaultValue: 'pendente'
    },
    aprovadorId: {
      type: Sequelize.UUID,
      allowNull: true
    },
    dataAprovacao: {
      type: Sequelize.DATE,
      allowNull: true
    },
    tenantId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  }, {
    tableName: 'movements',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        fields: ['tenantId', 'colaboradorId']
      },
      {
        fields: ['tenantId', 'tipo']
      },
      {
        fields: ['tenantId', 'dataEfetivacao']
      }
    ]
  });

  Movement.associate = (models) => {
    Movement.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    
    Movement.belongsTo(models.Employee, {
      foreignKey: 'colaboradorId',
      as: 'colaborador'
    });
    
    Movement.belongsTo(models.User, {
      foreignKey: 'aprovadorId',
      as: 'aprovador'
    });
  };

  return Movement;
};
