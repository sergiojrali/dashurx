# WhatsApp SaaS - Sistema Completo de Chatbots

Este é um sistema completo de chatbots para WhatsApp desenvolvido como uma plataforma SaaS (Software as a Service). O sistema permite criar, gerenciar e configurar múltiplos bots de WhatsApp com interface visual para criação de fluxos de conversa.

## 🚀 Funcionalidades

### Backend (Flask)
- ✅ Sistema de autenticação e autorização JWT
- ✅ APIs RESTful para gerenciamento de usuários
- ✅ APIs para gerenciamento de bots (CRUD completo)
- ✅ Sistema de fluxos de conversa com nós e conexões
- ✅ Integração com WhatsApp Web.js
- ✅ Gerenciamento de múltiplas instâncias de bots
- ✅ Sistema de mensagens e histórico
- ✅ Banco de dados SQLite com SQLAlchemy

### Frontend (React)
- ✅ Interface moderna e responsiva com Tailwind CSS
- ✅ Sistema de autenticação (login/registro)
- ✅ Dashboard com estatísticas e métricas
- ✅ Gerenciamento visual de bots
- ✅ Interface para configuração de fluxos
- ✅ Tema escuro/claro
- ✅ Componentes reutilizáveis com shadcn/ui

### Funcionalidades Principais
- 🤖 Criação e gerenciamento de múltiplos bots
- 💬 Sistema de fluxos de conversa visual
- 📊 Dashboard com métricas e relatórios
- 🔐 Autenticação segura com JWT
- 📱 Interface responsiva para desktop e mobile
- ⚡ Integração em tempo real com WhatsApp
- 🎨 Design moderno inspirado no WhatsApp

## 📁 Estrutura do Projeto

```
whatsapp-saas/
├── whatsapp-saas-backend/          # Backend Flask
│   ├── src/
│   │   ├── models/                 # Modelos do banco de dados
│   │   ├── routes/                 # Rotas da API
│   │   ├── database/               # Configuração do banco
│   │   ├── static/                 # Arquivos estáticos
│   │   ├── whatsapp_manager.py     # Gerenciador do WhatsApp
│   │   └── main.py                 # Arquivo principal
│   ├── venv/                       # Ambiente virtual Python
│   └── requirements.txt            # Dependências Python
├── whatsapp-saas-frontend/         # Frontend React
│   ├── src/
│   │   ├── components/             # Componentes React
│   │   ├── pages/                  # Páginas da aplicação
│   │   ├── hooks/                  # Hooks customizados
│   │   ├── lib/                    # Utilitários e API client
│   │   └── assets/                 # Assets estáticos
│   ├── public/                     # Arquivos públicos
│   └── package.json                # Dependências Node.js
├── bot-zdg/                        # Bot original (referência)
└── README.md                       # Esta documentação
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- npm ou pnpm

### Backend (Flask)

1. **Navegue para o diretório do backend:**
```bash
cd whatsapp-saas-backend
```

2. **Ative o ambiente virtual:**
```bash
source venv/bin/activate
```

3. **Instale as dependências:**
```bash
pip install -r requirements.txt
```

4. **Execute o servidor:**
```bash
python src/main.py
```

O backend estará disponível em: `http://localhost:5000`

### Frontend (React)

1. **Navegue para o diretório do frontend:**
```bash
cd whatsapp-saas-frontend
```

2. **Instale as dependências:**
```bash
npm install
# ou
pnpm install
```

3. **Execute o servidor de desenvolvimento:**
```bash
npm run dev
# ou
pnpm run dev
```

O frontend estará disponível em: `http://localhost:3000`

## 🔧 Configuração

### Variáveis de Ambiente

**Backend (.env):**
```env
SECRET_KEY=sua_chave_secreta_aqui
JWT_SECRET_KEY=sua_chave_jwt_aqui
DATABASE_URL=sqlite:///database/app.db
FLASK_ENV=development
```

**Frontend (.env):**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Banco de Dados

O sistema usa SQLite por padrão. O banco será criado automaticamente na primeira execução em:
```
whatsapp-saas-backend/src/database/app.db
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil

### Bots
- `GET /api/bots` - Listar bots
- `POST /api/bots` - Criar bot
- `GET /api/bots/{id}` - Obter bot
- `PUT /api/bots/{id}` - Atualizar bot
- `DELETE /api/bots/{id}` - Excluir bot

### Fluxos
- `GET /api/bots/{id}/flows` - Listar fluxos do bot
- `POST /api/bots/{id}/flows` - Criar fluxo
- `PUT /api/flows/{id}` - Atualizar fluxo
- `DELETE /api/flows/{id}` - Excluir fluxo

### WhatsApp
- `POST /api/whatsapp/bots/{id}/start` - Iniciar bot
- `POST /api/whatsapp/bots/{id}/stop` - Parar bot
- `GET /api/whatsapp/bots/{id}/status` - Status do bot
- `POST /api/whatsapp/bots/{id}/send-message` - Enviar mensagem

## 🎨 Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **Flask-JWT-Extended** - Autenticação JWT
- **Flask-CORS** - Suporte a CORS
- **WhatsApp-Web.js** - Integração com WhatsApp

### Frontend
- **React 18** - Biblioteca JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **Lucide React** - Ícones
- **Recharts** - Gráficos e visualizações
- **React Router** - Roteamento

## 🔐 Segurança

- Autenticação JWT com tokens seguros
- Validação de dados no backend e frontend
- Sanitização de inputs
- CORS configurado adequadamente
- Senhas hasheadas com bcrypt

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- 💻 Desktop (1024px+)
- 📱 Tablet (768px - 1023px)
- 📱 Mobile (320px - 767px)

## 🚀 Deploy

### Desenvolvimento
O sistema está configurado para desenvolvimento local. Para produção, considere:

1. **Backend:**
   - Use um servidor WSGI como Gunicorn
   - Configure um banco PostgreSQL ou MySQL
   - Use variáveis de ambiente para configurações sensíveis

2. **Frontend:**
   - Execute `npm run build` para gerar os arquivos de produção
   - Sirva os arquivos estáticos com nginx ou similar

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- 📧 Email: suporte@whatsappsaas.com
- 💬 WhatsApp: +55 11 99999-9999
- 🌐 Website: https://whatsappsaas.com

---

**Desenvolvido com ❤️ para automatizar conversas no WhatsApp**

