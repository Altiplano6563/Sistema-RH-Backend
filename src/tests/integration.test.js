// Implementação de testes de integração para validação do sistema
const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../src/config/config');

// Dados de teste
let testTenant;
let testUser;
let testToken;

// Configuração antes dos testes
beforeAll(async () => {
  // Limpar banco de dados de teste
  await sequelize.sync({ force: true });
  
  // Criar tenant de teste
  const { Tenant } = require('../src/models');
  testTenant = await Tenant.create({
    nome: 'Empresa Teste',
    cnpj: '12345678901234',
    plano: 'basic',
    status: 'trial'
  });
  
  // Criar usuário de teste
  const { User } = require('../src/models');
  const hashedPassword = await bcrypt.hash('senha123', 10);
  testUser = await User.create({
    tenantId: testTenant.id,
    nome: 'Usuário Teste',
    email: 'teste@empresa.com',
    senha: hashedPassword,
    perfil: 'admin',
    status: 'ativo'
  });
  
  // Gerar token de teste
  const payload = {
    userId: testUser.id,
    tenantId: testUser.tenantId,
    email: testUser.email,
    perfil: testUser.perfil,
    tokenVersion: testUser.tokenVersion
  };
  
  testToken = jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: '1h' }
  );
});

// Limpeza após os testes
afterAll(async () => {
  await sequelize.close();
});

// Testes de autenticação
describe('Autenticação', () => {
  test('Deve fazer login com credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teste@empresa.com',
        senha: 'senha123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');
    expect(response.body.data).toHaveProperty('user');
  });
  
  test('Deve rejeitar login com senha inválida', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teste@empresa.com',
        senha: 'senha_errada'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });
  
  test('Deve verificar token válido', async () => {
    const response = await request(app)
      .get('/api/auth/check')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('id', testUser.id);
  });
  
  test('Deve rejeitar token inválido', async () => {
    const response = await request(app)
      .get('/api/auth/check')
      .set('Authorization', 'Bearer token_invalido');
    
    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
  });
});

// Testes de multitenancy
describe('Multitenancy', () => {
  test('Deve isolar dados entre tenants', async () => {
    // Criar segundo tenant
    const { Tenant, User } = require('../src/models');
    const tenant2 = await Tenant.create({
      nome: 'Empresa Teste 2',
      cnpj: '98765432109876',
      plano: 'basic',
      status: 'trial'
    });
    
    // Criar usuário no segundo tenant
    const hashedPassword = await bcrypt.hash('senha123', 10);
    const user2 = await User.create({
      tenantId: tenant2.id,
      nome: 'Usuário Teste 2',
      email: 'teste@empresa2.com',
      senha: hashedPassword,
      perfil: 'admin',
      status: 'ativo'
    });
    
    // Gerar token para usuário do segundo tenant
    const payload = {
      userId: user2.id,
      tenantId: user2.tenantId,
      email: user2.email,
      perfil: user2.perfil,
      tokenVersion: user2.tokenVersion
    };
    
    const token2 = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    // Criar departamento no primeiro tenant
    const { Department } = require('../src/models');
    await Department.create({
      tenantId: testTenant.id,
      nome: 'Departamento Tenant 1',
      status: 'ativo'
    });
    
    // Verificar que usuário do tenant 1 vê apenas seus departamentos
    const response1 = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response1.status).toBe(200);
    expect(response1.body.data).toHaveLength(1);
    expect(response1.body.data[0].nome).toBe('Departamento Tenant 1');
    
    // Verificar que usuário do tenant 2 não vê departamentos do tenant 1
    const response2 = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${token2}`);
    
    expect(response2.status).toBe(200);
    expect(response2.body.data).toHaveLength(0);
  });
});

// Testes de dashboard
describe('Dashboard', () => {
  test('Deve retornar estatísticas do dashboard', async () => {
    // Criar dados de teste para o dashboard
    const { Department, Position, Employee } = require('../src/models');
    
    // Criar departamento
    const dept = await Department.create({
      tenantId: testTenant.id,
      nome: 'TI',
      status: 'ativo'
    });
    
    // Criar cargo
    const position = await Position.create({
      tenantId: testTenant.id,
      nome: 'Desenvolvedor',
      nivel: 'pleno',
      departamentoId: dept.id,
      status: 'ativo'
    });
    
    // Criar colaboradores
    await Employee.create({
      tenantId: testTenant.id,
      nome: 'João Silva',
      email: 'joao@empresa.com',
      cpf: '12345678901',
      departamentoId: dept.id,
      cargoId: position.id,
      salario: 5000,
      dataAdmissao: new Date(),
      modalidadeTrabalho: 'hibrido',
      cargaHoraria: 220,
      status: 'ativo'
    });
    
    await Employee.create({
      tenantId: testTenant.id,
      nome: 'Maria Souza',
      email: 'maria@empresa.com',
      cpf: '10987654321',
      departamentoId: dept.id,
      cargoId: position.id,
      salario: 5500,
      dataAdmissao: new Date(),
      modalidadeTrabalho: 'remoto',
      cargaHoraria: 220,
      status: 'ativo'
    });
    
    // Testar endpoint de estatísticas
    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('totalEmployees', 2);
    expect(response.body.data).toHaveProperty('workModeDistribution');
    expect(response.body.data.workModeDistribution).toHaveLength(2);
  });
});

// Testes de segurança
describe('Segurança', () => {
  test('Deve bloquear acesso sem autenticação', async () => {
    const response = await request(app)
      .get('/api/employees');
    
    expect(response.status).toBe(401);
  });
  
  test('Deve validar permissões de acesso', async () => {
    // Criar usuário com perfil limitado
    const { User } = require('../src/models');
    const hashedPassword = await bcrypt.hash('senha123', 10);
    const limitedUser = await User.create({
      tenantId: testTenant.id,
      nome: 'Usuário Limitado',
      email: 'limitado@empresa.com',
      senha: hashedPassword,
      perfil: 'visualizador',
      status: 'ativo'
    });
    
    // Gerar token para usuário limitado
    const payload = {
      userId: limitedUser.id,
      tenantId: limitedUser.tenantId,
      email: limitedUser.email,
      perfil: limitedUser.perfil,
      tokenVersion: limitedUser.tokenVersion
    };
    
    const limitedToken = jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    // Tentar criar um departamento (operação restrita)
    const response = await request(app)
      .post('/api/departments')
      .set('Authorization', `Bearer ${limitedToken}`)
      .send({
        nome: 'Novo Departamento',
        status: 'ativo'
      });
    
    expect(response.status).toBe(403);
    expect(response.body.status).toBe('error');
  });
});

// Testes de LGPD
describe('LGPD', () => {
  test('Deve exportar dados pessoais do usuário', async () => {
    const response = await request(app)
      .get(`/api/users/${testUser.id}/personal-data`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data).toHaveProperty('usuario');
    expect(response.body.data.usuario).toHaveProperty('nome', testUser.nome);
    expect(response.body.data.usuario).toHaveProperty('email', testUser.email);
  });
  
  test('Deve anonimizar dados de usuário inativo', async () => {
    // Criar usuário para anonimização
    const { User } = require('../src/models');
    const hashedPassword = await bcrypt.hash('senha123', 10);
    const userToAnonymize = await User.create({
      tenantId: testTenant.id,
      nome: 'Usuário para Anonimizar',
      email: 'anonimizar@empresa.com',
      senha: hashedPassword,
      perfil: 'colaborador',
      status: 'ativo'
    });
    
    // Anonimizar usuário
    const response = await request(app)
      .post(`/api/users/${userToAnonymize.id}/anonymize`)
      .set('Authorization', `Bearer ${testToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    
    // Verificar se dados foram anonimizados
    const anonymizedUser = await User.findByPk(userToAnonymize.id);
    expect(anonymizedUser.nome).toContain('Usuário Anonimizado');
    expect(anonymizedUser.email).toContain('@anonimizado.com');
    expect(anonymizedUser.status).toBe('inativo');
  });
});

// Testes de performance
describe('Performance', () => {
  test('Deve responder em tempo aceitável', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${testToken}`);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(1000); // Menos de 1 segundo
  });
});
