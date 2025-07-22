# DashURX - Sistema SaaS de WhatsApp

![DashURX Logo](https://img.shields.io/badge/DashURX-WhatsApp%20SaaS-25D366?style=for-the-badge&logo=whatsapp)

## 🚀 Visão Geral

DashURX é uma plataforma SaaS completa para automação e gerenciamento de WhatsApp Business. O sistema permite criar, configurar e gerenciar múltiplos bots de WhatsApp com interface visual drag-and-drop para criação de fluxos de conversa.

## ✨ Funcionalidades Principais

### 🤖 Gerenciamento de Bots
- **Criação e configuração** de múltiplos bots WhatsApp
- **Conexão via QR Code** com interface em tempo real
- **Monitoramento de status** e saúde dos bots
- **Gestão de sessões** persistentes e seguras

### 💬 Sistema de Mensagens
- **Envio e recebimento** de mensagens em tempo real
- **Suporte a múltiplos tipos** de mídia (texto, imagem, áudio, vídeo, documentos)
- **Filtros avançados** por bot, direção, tipo e período
- **Busca inteligente** em conversas e contatos
- **Interface intuitiva** para gerenciamento de conversas

### 🎨 Editor Visual de Fluxos
- **Interface drag-and-drop** para criação de fluxos
- **Componentes visuais** para diferentes tipos de nós:
  - **Nó de Mensagem**: Envio de textos e mídias
  - **Nó de Condição**: Ramificações condicionais (Sim/Não)
  - **Nó de Delay**: Pausas temporais no fluxo
  - **Nó de Ação**: Webhooks, transferências, finalizações
- **Conexões visuais** entre nós com validação
- **Salvamento automático** de posições e configurações

### 📊 Relatórios e Analytics
- **Gráficos interativos** de performance
- **Métricas detalhadas** de mensagens e contatos
- **Análise temporal** com filtros por período
- **Comparação de performance** entre bots
- **Exportação de relatórios** em múltiplos formatos

### 🔐 Segurança e Autenticação
- **Sistema de autenticação** JWT robusto
- **Variáveis de ambiente** para configurações sensíveis
- **Controle de acesso** por usuário
- **Sessões seguras** e criptografadas

## 🏗️ Arquitetura do Sistema

### Backend (Python/Flask)
```
whatsapp-saas-backend/
├── src/
│   ├── models/          # Modelos de dados (User, Bot, Flow, etc.)
│   ├── routes/          # Endpoints da API REST
│   ├── whatsapp_module/ # Módulo WhatsApp integrado
│   └── main.py          # Aplicação principal
├── instance/            # Banco de dados SQLite
└── requirements.txt     # Dependências Python
```

### Frontend (React/Vite)
```
whatsapp-saas-frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── ui/         # Componentes de interface
│   │   └── flow/       # Componentes do editor de fluxos
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Hooks customizados
│   └── lib/            # Utilitários e configurações
└── package.json        # Dependências Node.js
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **Flask-JWT-Extended** - Autenticação JWT
- **WhatsApp-Web.js** - Integração com WhatsApp
- **Socket.IO** - Comunicação em tempo real
- **SQLite** - Banco de dados

### Frontend
- **React 18** - Biblioteca de interface
- **Vite** - Build tool e dev server
- **ReactFlow** - Editor visual de fluxos
- **Recharts** - Gráficos e visualizações
- **Tailwind CSS** - Framework de estilos
- **Shadcn/ui** - Componentes de interface

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **Python** 3.11+
- **Git** para controle de versão
- **Chrome/Chromium** para WhatsApp Web

## 🚀 Instalação e Configuração

### 1. Clone o Repositório
```bash
git clone https://github.com/sergiojrali/dashurx.git
cd dashurx
```

### 2. Configuração do Backend
```bash
cd whatsapp-saas-backend

# Criar ambiente virtual
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### 3. Configuração do Frontend
```bash
cd ../whatsapp-saas-frontend

# Instalar dependências
npm install --legacy-peer-deps

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite o arquivo .env.local com suas configurações
```

### 4. Inicialização dos Serviços

#### Backend
```bash
cd whatsapp-saas-backend
source venv/bin/activate
python src/main.py
```
O backend estará disponível em `http://localhost:5000`

#### Frontend
```bash
cd whatsapp-saas-frontend
npm run dev
```
O frontend estará disponível em `http://localhost:5173`

## 🔧 Configuração de Ambiente

### Backend (.env)
```env
# Segurança
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-in-production

# Banco de Dados
DATABASE_URL=sqlite:///instance/app.db

# Flask
FLASK_ENV=development
FLASK_DEBUG=True

# WhatsApp
WHATSAPP_BASE_PORT=8000

# CORS
CORS_ORIGINS=*
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=DashURX
```

## 📚 Guia de Uso

### 1. Primeiro Acesso
1. Acesse `http://localhost:5173`
2. Registre uma nova conta
3. Faça login com suas credenciais

### 2. Criando um Bot
1. Vá para a página "Bots"
2. Clique em "Novo Bot"
3. Preencha as informações do bot
4. Escaneie o QR Code com seu WhatsApp
5. Aguarde a conexão ser estabelecida

### 3. Criando Fluxos de Conversa
1. Acesse o bot criado
2. Clique em "Editar Fluxos"
3. Use a interface drag-and-drop para criar o fluxo
4. Adicione nós de mensagem, condição, delay e ação
5. Conecte os nós conforme a lógica desejada
6. Salve o fluxo

### 4. Monitoramento
1. Use a página "Mensagens" para ver conversas
2. Acesse "Relatórios" para analytics
3. Monitore o status dos bots no dashboard

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Bots
- `GET /api/bots` - Listar bots
- `POST /api/bots` - Criar bot
- `GET /api/bots/{id}` - Obter bot
- `PUT /api/bots/{id}` - Atualizar bot
- `DELETE /api/bots/{id}` - Excluir bot

### Fluxos
- `GET /api/flows/{id}` - Obter fluxo
- `PUT /api/flows/{id}` - Atualizar fluxo
- `POST /api/flows/{id}/nodes` - Criar nó
- `PUT /api/flows/{id}/nodes/{nodeId}` - Atualizar nó

### Mensagens
- `GET /api/messages` - Listar mensagens
- `POST /api/messages/send` - Enviar mensagem

## 🧪 Testes

### Backend
```bash
cd whatsapp-saas-backend
source venv/bin/activate
python -m pytest tests/
```

### Frontend
```bash
cd whatsapp-saas-frontend
npm run test
```

## 📦 Deploy

### Desenvolvimento
O sistema está configurado para desenvolvimento local. Para produção, considere:

1. **Banco de dados**: Migrar para PostgreSQL ou MySQL
2. **Variáveis de ambiente**: Configurar adequadamente
3. **HTTPS**: Implementar certificados SSL
4. **Proxy reverso**: Usar Nginx ou similar
5. **Monitoramento**: Implementar logs e métricas

### Docker (Opcional)
```bash
# Build das imagens
docker-compose build

# Iniciar serviços
docker-compose up -d
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/sergiojrali/dashurx/issues)
- **Documentação**: [Wiki do Projeto](https://github.com/sergiojrali/dashurx/wiki)
- **Email**: suporte@dashurx.com

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] **Integração com APIs externas** (CRM, E-commerce)
- [ ] **Templates de fluxos** pré-configurados
- [ ] **Análise de sentimento** em mensagens
- [ ] **Chatbot com IA** integrado
- [ ] **Agendamento de mensagens** em massa
- [ ] **Relatórios avançados** com BI
- [ ] **App mobile** para gerenciamento
- [ ] **Integração com Zapier** e Make

### Melhorias Técnicas
- [ ] **Testes automatizados** completos
- [ ] **CI/CD pipeline** com GitHub Actions
- [ ] **Documentação da API** com Swagger
- [ ] **Monitoramento** com Prometheus/Grafana
- [ ] **Cache** com Redis
- [ ] **Filas** para processamento assíncrono

---

**Desenvolvido com ❤️ pela equipe DashURX**

![GitHub stars](https://img.shields.io/github/stars/sergiojrali/dashurx?style=social)
![GitHub forks](https://img.shields.io/github/forks/sergiojrali/dashurx?style=social)
![GitHub issues](https://img.shields.io/github/issues/sergiojrali/dashurx)
![GitHub license](https://img.shields.io/github/license/sergiojrali/dashurx)

