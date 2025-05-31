const Sequelize = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
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
    cpf: {
      type: Sequelize.STRING,
      allowNull: false
    },
    dataNascimento: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    genero: {
      type: Sequelize.ENUM('masculino', 'feminino', 'outro', 'nao_informado'),
      defaultValue: 'nao_informado'
    },
    telefone: {
      type: Sequelize.STRING,
      allowNull: true
    },
    endereco: {
      type: Sequelize.TEXT,
      allowNull: true
    },
    dataAdmissao: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    dataDemissao: {
      type: Sequelize.DATEONLY,
      allowNull: true
    },
    salario: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    departamentoId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    cargoId: {
      type: Sequelize.UUID,
      allowNull: false
    },
    modalidadeTrabalho: {
      type: Sequelize.ENUM('presencial', 'hibrido', 'remoto'),
      defaultValue: 'presencial'
    },
    cargaHoraria: {
      type: Sequelize.INTEGER,
      defaultValue: 220
    },
    status: {
      type: Sequelize.ENUM('ativo', 'inativo', 'afastado', 'ferias'),
      defaultValue: 'ativo'
    },
    tenantId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    paranoid: true, // Soft delete
    indexes: [
      {
        unique: true,
        fields: ['tenantId', 'cpf']
      },
      {
        unique: true,
        fields: ['tenantId', 'email']
      }
    ]
  });

  Employee.associate = (models) => {
    Employee.belongsTo(models.Tenant, {
      foreignKey: 'tenantId',
      as: 'tenant'
    });
    
    Employee.belongsTo(models.Department, {
      foreignKey: 'departamentoId',
      as: 'departamento'
    });
    
    Employee.belongsTo(models.Position, {
      foreignKey: 'cargoId',
      as: 'cargo'
    });
    
    Employee.hasMany(models.Movement, {
      foreignKey: 'colaboradorId',
      as: 'movimentacoes'
    });
  };

  return Employee;
};
