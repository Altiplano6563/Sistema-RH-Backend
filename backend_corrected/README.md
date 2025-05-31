# Instruções para Instalação e Uso do Backend Corrigido

Este documento contém instruções detalhadas para a instalação e uso do backend corrigido do sistema de gestão de RH.

## Estrutura do Projeto

O backend foi completamente revisado e padronizado, seguindo boas práticas de segurança e conformidade com a LGPD. A estrutura de diretórios é a seguinte:

```
backend_corrected/
├── config/                 # Configurações do sistema
├── controllers/            # Controladores da API
├── middleware/             # Middlewares de autenticação e tratamento de erros
├── models/                 # Modelos de dados (Mongoose)
├── routes/                 # Rotas da API
├── utils/                  # Utilitários
├── .env                    # Variáveis de ambiente
├── package.json            # Dependências do projeto
└── server.js               # Ponto de entrada da aplicação
```

## Requisitos

- Node.js (v14 ou superior)
- MongoDB (Atlas ou local)
- NPM ou Yarn

## Instalação

1. Extraia o arquivo `backend_corrected.zip` para o diretório desejado.

2. Navegue até o diretório extraído:
   ```bash
   cd backend_corrected
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```
   ou
   ```bash
   yarn install
   ```

4. Configure as variáveis de ambiente:
   - Edite o arquivo `.env` e atualize as seguintes variáveis:
     - `MONGO_URI`: URI de conexão com o MongoDB
     - `JWT_SECRET`: Chave secreta para geração de tokens JWT (use uma string longa e aleatória)
     - `ENCRYPTION_KEY`: Chave para criptografia de dados sensíveis (use uma string longa e aleatória)
     - `CORS_ORIGIN`: URL do frontend (ex: http://localhost:3000)

## Execução

1. Para iniciar o servidor em modo de desenvolvimento:
   ```bash
   npm run dev
   ```
   ou
   ```bash
   yarn dev
   ```

2. Para iniciar o servidor em modo de produção:
   ```bash
   npm start
   ```
   ou
   ```bash
   yarn start
   ```

O servidor será iniciado na porta 5000 por padrão (ou na porta definida na variável de ambiente `PORT`).

## Integração com o Frontend

O backend foi projetado para integrar perfeitamente com o frontend React. Para conectar o frontend ao backend:

1. Certifique-se de que a variável `REACT_APP_API_URL` no frontend esteja apontando para a URL do backend:
   - Em desenvolvimento: `http://localhost:5000`
   - Em produção: URL do seu servidor

2. O arquivo `api.js` no frontend já está configurado para usar esta URL base e adicionar os tokens de autenticação automaticamente.

3. Todas as rotas da API seguem o padrão RESTful:
   - `/api/auth` - Autenticação e gerenciamento de usuários
   - `/api/employees` - Gerenciamento de funcionários
   - `/api/departments` - Gerenciamento de departamentos
   - `/api/positions` - Gerenciamento de cargos
   - `/api/movements` - Gerenciamento de movimentações
   - `/api/salary-tables` - Gerenciamento de tabelas salariais
   - `/api/dashboard` - Dados para o dashboard

## Segurança e LGPD

O backend foi revisado para garantir conformidade com a LGPD e boas práticas de segurança:

1. **Criptografia de dados sensíveis**: CPF, data de nascimento e salários são criptografados no banco de dados.

2. **Controle de acesso**: Implementação de autenticação JWT e autorização baseada em perfis.

3. **Proteção contra ataques comuns**:
   - Rate limiting para prevenir ataques de força bruta
   - Helmet para proteção contra vulnerabilidades comuns
   - Validação de entrada para prevenir injeção

4. **Logs e tratamento de erros**: Sistema centralizado de tratamento de erros que não expõe detalhes sensíveis em produção.

5. **Refresh tokens**: Implementação de refresh tokens para melhor experiência do usuário sem comprometer a segurança.

## Observações Importantes

1. **Ambiente de Produção**: Antes de implantar em produção, certifique-se de:
   - Alterar as chaves secretas no arquivo `.env`
   - Configurar `NODE_ENV=production`
   - Configurar um serviço de monitoramento (como PM2)

2. **Backup de Dados**: Implemente uma rotina de backup do banco de dados para evitar perda de dados.

3. **HTTPS**: Em produção, sempre use HTTPS para proteger a comunicação entre cliente e servidor.

4. **Monitoramento**: Considere implementar ferramentas de monitoramento para detectar comportamentos anômalos.

## Suporte

Se encontrar algum problema ou tiver dúvidas sobre a implementação, entre em contato com a equipe de desenvolvimento.

---

Este backend foi revisado e otimizado para garantir desempenho, segurança e conformidade com as melhores práticas de desenvolvimento.
