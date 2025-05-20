# Configuração do PostgreSQL para Produção

Este arquivo contém as instruções para configurar o PostgreSQL para o ambiente de produção do Sistema de RH Online.

## Variáveis de Ambiente

Para conectar ao PostgreSQL em produção, configure as seguintes variáveis de ambiente:

```
NODE_ENV=production
DB_HOST=seu-host-postgresql
DB_PORT=5432
DB_NAME=sistema_rh
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_SSL=true
```

## Migração de Dados

Para migrar os dados do ambiente de desenvolvimento (SQLite) para produção (PostgreSQL):

1. Exporte os dados do SQLite:
   ```
   node scripts/export-data.js
   ```

2. Importe os dados para o PostgreSQL:
   ```
   node scripts/import-data.js
   ```

## Índices e Constraints

Todos os modelos foram configurados com índices únicos compostos para garantir a integridade dos dados:

- **Department**: Índice único em `[tenantId, nome]`
- **Employee**: Índices únicos em `[tenantId, cpf]` e `[tenantId, email]`
- **User**: Índice único em `[tenantId, email]`
- **Position**: Índice único em `[tenantId, nome, nivel]`
- **Movement**: Índices em `[tenantId, colaboradorId]`, `[tenantId, tipo]` e `[tenantId, dataEfetivacao]`

## Verificação de Conexão

Para verificar a conexão com o PostgreSQL:

```
node scripts/test-connection.js
```

## Backup e Restauração

Para realizar backup do banco de dados:

```
pg_dump -U seu-usuario -h seu-host -d sistema_rh > backup.sql
```

Para restaurar o banco de dados:

```
psql -U seu-usuario -h seu-host -d sistema_rh < backup.sql
```
