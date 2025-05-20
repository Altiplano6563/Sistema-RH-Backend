'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar tabela de tenants (empresas)
    await queryInterface.createTable('tenants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      nome: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cnpj: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      plano: {
        type: Sequelize.ENUM('basic', 'standard', 'premium'),
        allowNull: false,
        defaultValue: 'basic'
      },
      status: {
        type: Sequelize.ENUM('trial', 'ativo', 'inativo', 'bloqueado'),
        allowNull: false,
        defaultValue: 'trial'
      },
      dataExpiracao: {
        type: Sequelize.DATE,
        allowNull: true
      },
      dataCriacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dataAtualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Criar tabela de usuários
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        type: Sequelize.ENUM('admin', 'rh', 'gestor', 'colaborador'),
        allowNull: false,
        defaultValue: 'colaborador'
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo', 'bloqueado'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      ultimoAcesso: {
        type: Sequelize.DATE,
        allowNull: true
      },
      tokenVersion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      dataCriacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dataAtualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Adicionar índice único para email por tenant
    await queryInterface.addIndex('users', ['tenantId', 'email'], {
      unique: true,
      name: 'users_tenant_email_unique'
    });

    // Criar tabela de departamentos
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      departamentoPaiId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      centroCusto: {
        type: Sequelize.STRING,
        allowNull: true
      },
      orcamento: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      dataCriacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dataAtualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Adicionar índice único para nome por tenant
    await queryInterface.addIndex('departments', ['tenantId', 'nome'], {
      unique: true,
      name: 'departments_tenant_nome_unique'
    });

    // Criar tabela de cargos
    await queryInterface.createTable('positions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        type: Sequelize.ENUM('junior', 'pleno', 'senior', 'especialista'),
        allowNull: false,
        defaultValue: 'junior'
      },
      departamentoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        allowNull: false,
        defaultValue: 'ativo'
      },
      dataCriacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dataAtualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Adicionar índice único para nome, nível e departamento por tenant
    await queryInterface.addIndex('positions', ['tenantId', 'nome', 'nivel', 'departamentoId'], {
      unique: true,
      name: 'positions_tenant_nome_nivel_departamento_unique'
    });

    // Criar tabela de colaboradores
    await queryInterface.createTable('employees', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        allowNull: false,
        defaultValue: 'nao_informado'
      },
      telefone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      endereco: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      departamentoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cargoId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'positions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      salario: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      dataAdmissao: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      dataDemissao: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      modalidadeTrabalho: {
        type: Sequelize.ENUM('presencial', 'hibrido', 'remoto'),
        allowNull: false,
        defaultValue: 'presencial'
      },
      cargaHoraria: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 220
      },
      status: {
        type: Sequelize.ENUM('ativo', 'inativo', 'afastado', 'ferias'),
        allowNull: false,
        defaultValue: 'ativo'
      },
      dataCriacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dataAtualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Adicionar índice único para CPF por tenant
    await queryInterface.addIndex('employees', ['tenantId', 'cpf'], {
      unique: true,
      name: 'employees_tenant_cpf_unique'
    });

    // Adicionar índice único para email por tenant
    await queryInterface.addIndex('employees', ['tenantId', 'email'], {
      unique: true,
      name: 'employees_tenant_email_unique'
    });

    // Criar tabela de movimentações
    await queryInterface.createTable('movements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      colaboradorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tipo: {
        type: Sequelize.ENUM('promocao', 'transferencia', 'merito', 'equiparacao', 'modalidade', 'cargaHoraria'),
        allowNull: false
      },
      dataEfetivacao: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      valorAnterior: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      valorNovo: {
        type: Sequelize.JSONB,
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
      aprovadorId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('pendente', 'aprovado', 'rejeitado'),
        allowNull: false,
        defaultValue: 'pendente'
      },
      dataCriacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      dataAtualizacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Adicionar índices para consultas frequentes
    await queryInterface.addIndex('movements', ['tenantId', 'colaboradorId']);
    await queryInterface.addIndex('movements', ['tenantId', 'tipo']);
    await queryInterface.addIndex('movements', ['tenantId', 'dataEfetivacao']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remover tabelas na ordem inversa para evitar problemas com chaves estrangeiras
    await queryInterface.dropTable('movements');
    await queryInterface.dropTable('employees');
    await queryInterface.dropTable('positions');
    await queryInterface.dropTable('departments');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('tenants');
  }
};
