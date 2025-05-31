# API do Sistema de RH Online - Documentação

## Visão Geral

Esta API fornece endpoints para gerenciamento completo de recursos humanos, incluindo colaboradores, departamentos, cargos, movimentações e dashboard analítico. O sistema suporta múltiplas empresas (multitenancy) e possui controle de acesso baseado em perfis.

## Autenticação

A API utiliza autenticação JWT (JSON Web Token) para proteger os endpoints. Todos os endpoints, exceto os de autenticação pública, requerem um token válido.

### Endpoints de Autenticação

#### Registro de Empresa e Usuário Admin
- **POST /api/auth/register**
  - Cria uma nova empresa (tenant) e um usuário administrador
  - Corpo: `{ empresa, cnpj, nome, email, senha, cargo }`
  - Retorno: Dados do usuário e tokens de acesso

#### Login
- **POST /api/auth/login**
  - Autentica um usuário existente
  - Corpo: `{ email, senha }`
  - Retorno: Dados do usuário e tokens de acesso

#### Renovação de Token
- **POST /api/auth/refresh-token**
  - Renova o token de acesso usando um refresh token
  - Corpo: `{ refreshToken }`
  - Retorno: Novos tokens de acesso

#### Logout
- **POST /api/auth/logout** (requer autenticação)
  - Invalida o refresh token do usuário
  - Retorno: Confirmação de logout

#### Verificação de Autenticação
- **GET /api/auth/check** (requer autenticação)
  - Verifica se o token é válido
  - Retorno: Dados do usuário autenticado

## Colaboradores

### Endpoints de Colaboradores

#### Listar Colaboradores
- **GET /api/employees** (requer autenticação)
  - Parâmetros de consulta: `search, departamentoId, cargoId, status, modalidade, page, limit`
  - Retorno: Lista paginada de colaboradores

#### Obter Colaborador por ID
- **GET /api/employees/:id** (requer autenticação)
  - Retorno: Dados detalhados do colaborador e suas movimentações

#### Criar Colaborador
- **POST /api/employees** (requer autenticação, perfis: admin, rh, gestor)
  - Corpo: Dados completos do colaborador
  - Retorno: Dados do colaborador criado

#### Atualizar Colaborador
- **PUT /api/employees/:id** (requer autenticação, perfis: admin, rh, gestor)
  - Corpo: Dados a serem atualizados
  - Retorno: Dados do colaborador atualizado

#### Remover Colaborador
- **DELETE /api/employees/:id** (requer autenticação, perfis: admin, rh)
  - Retorno: Confirmação de remoção

## Departamentos

### Endpoints de Departamentos

#### Listar Departamentos
- **GET /api/departments** (requer autenticação)
  - Parâmetros de consulta: `search, status, page, limit`
  - Retorno: Lista paginada de departamentos

#### Obter Departamento por ID
- **GET /api/departments/:id** (requer autenticação)
  - Retorno: Dados detalhados do departamento e seus colaboradores

#### Criar Departamento
- **POST /api/departments** (requer autenticação, perfis: admin, rh)
  - Corpo: Dados do departamento
  - Retorno: Dados do departamento criado

#### Atualizar Departamento
- **PUT /api/departments/:id** (requer autenticação, perfis: admin, rh)
  - Corpo: Dados a serem atualizados
  - Retorno: Dados do departamento atualizado

#### Remover Departamento
- **DELETE /api/departments/:id** (requer autenticação, perfis: admin, rh)
  - Retorno: Confirmação de remoção

## Cargos

### Endpoints de Cargos

#### Listar Cargos
- **GET /api/positions** (requer autenticação)
  - Parâmetros de consulta: `search, departamentoId, nivel, status, page, limit`
  - Retorno: Lista paginada de cargos

#### Obter Cargo por ID
- **GET /api/positions/:id** (requer autenticação)
  - Retorno: Dados detalhados do cargo e colaboradores associados

#### Criar Cargo
- **POST /api/positions** (requer autenticação, perfis: admin, rh)
  - Corpo: Dados do cargo
  - Retorno: Dados do cargo criado

#### Atualizar Cargo
- **PUT /api/positions/:id** (requer autenticação, perfis: admin, rh)
  - Corpo: Dados a serem atualizados
  - Retorno: Dados do cargo atualizado

#### Remover Cargo
- **DELETE /api/positions/:id** (requer autenticação, perfis: admin, rh)
  - Retorno: Confirmação de remoção

## Movimentações

### Endpoints de Movimentações

#### Listar Movimentações
- **GET /api/movements** (requer autenticação)
  - Parâmetros de consulta: `colaboradorId, tipo, status, dataInicio, dataFim, page, limit`
  - Retorno: Lista paginada de movimentações

#### Obter Movimentação por ID
- **GET /api/movements/:id** (requer autenticação)
  - Retorno: Dados detalhados da movimentação

#### Criar Movimentação
- **POST /api/movements** (requer autenticação, perfis: admin, rh, gestor)
  - Corpo: Dados da movimentação
  - Retorno: Dados da movimentação criada

#### Aprovar Movimentação
- **POST /api/movements/:id/approve** (requer autenticação, perfis: admin, rh)
  - Retorno: Dados da movimentação aprovada

#### Rejeitar Movimentação
- **POST /api/movements/:id/reject** (requer autenticação, perfis: admin, rh)
  - Corpo: `{ motivoRejeicao }`
  - Retorno: Dados da movimentação rejeitada

## Dashboard

### Endpoints de Dashboard

#### Estatísticas Gerais
- **GET /api/dashboard/stats** (requer autenticação)
  - Retorno: Estatísticas gerais (totais de colaboradores, departamentos, cargos, etc.)

#### Distribuição por Departamento
- **GET /api/dashboard/department-distribution** (requer autenticação)
  - Retorno: Distribuição de colaboradores por departamento

#### Distribuição por Cargo
- **GET /api/dashboard/position-distribution** (requer autenticação)
  - Retorno: Distribuição de colaboradores por cargo

#### Distribuição por Modalidade de Trabalho
- **GET /api/dashboard/workmode-distribution** (requer autenticação)
  - Retorno: Distribuição de colaboradores por modalidade de trabalho

#### Distribuição por Carga Horária
- **GET /api/dashboard/workload-distribution** (requer autenticação)
  - Retorno: Distribuição de colaboradores por carga horária

#### Histórico de Movimentações
- **GET /api/dashboard/movement-history** (requer autenticação)
  - Parâmetros de consulta: `meses`
  - Retorno: Histórico de movimentações agrupadas por mês e tipo

#### Análise Salarial
- **GET /api/dashboard/salary-analysis** (requer autenticação, perfis: admin, rh)
  - Retorno: Análise salarial por cargo e colaboradores fora da faixa salarial

## Códigos de Status

- 200: Sucesso
- 201: Criado com sucesso
- 400: Requisição inválida
- 401: Não autorizado
- 403: Acesso proibido
- 404: Recurso não encontrado
- 500: Erro interno do servidor

## Formato de Resposta

Todas as respostas seguem o formato:

```json
{
  "status": "success" | "error",
  "message": "Mensagem descritiva",
  "data": { ... } // Opcional, presente apenas em respostas de sucesso
}
```

## Paginação

Endpoints que retornam listas suportam paginação com os seguintes parâmetros:
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)

Resposta inclui metadados de paginação:
```json
{
  "pagination": {
    "total": 100,
    "totalPages": 10,
    "currentPage": 1,
    "limit": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```
