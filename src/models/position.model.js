const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const Position = sequelize.define('Position', {
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
    nivel: {
      type: Sequelize.ENUM('junior', 'pleno', 'senior', 'especialista', 'coordenador', 'gerente', 'diretor'),
      allowNull: false
    },
    faixaSalarialMin: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    },
    faixaSalarialMax: {
      type: Sequelize.DECIMAL(10, 2),
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
    tableName: 'positions',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'nome', 'nivel']
      }
    ]
  });

  Position.associate = (models) => {
    Position.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    
    Position.hasMany(models.Employee, {
      foreignKey: 'cargoId',
      as: 'colaboradores'
    });
  };

  return Position;
};
