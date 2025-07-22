# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2025-01-22

### 🎉 Adicionado
- **Editor Visual de Fluxos**: Interface drag-and-drop completa para criação de fluxos de conversa
  - Componente MessageNode para envio de mensagens (texto, imagem, áudio, vídeo, documento)
  - Componente ConditionNode para ramificações condicionais (Sim/Não)
  - Componente DelayNode para pausas temporais no fluxo
  - Componente ActionNode para webhooks, transferências e finalizações
  - Conexões visuais entre nós com validação
  - Painel de ferramentas integrado
  - Salvamento automático de posições

- **Página de Mensagens**: Interface completa para gerenciamento de conversas
  - Visualização de mensagens em tempo real
  - Filtros avançados por bot, direção, tipo e período
  - Busca inteligente em conversas e contatos
  - Envio de novas mensagens com suporte a mídias
  - Interface responsiva e intuitiva

- **Página de Relatórios**: Analytics e métricas detalhadas
  - Gráficos interativos com Recharts
  - Estatísticas de performance dos bots
  - Métricas de mensagens e contatos únicos
  - Taxa de resposta e tempo médio de resposta
  - Análise temporal com filtros por período
  - Comparação de performance entre bots
  - Exportação de relatórios

- **Módulo WhatsApp Integrado**: Sistema autossuficiente sem dependências externas
  - Classe WhatsAppBot para gerenciamento de instâncias
  - APIs REST para controle de bots
  - Suporte a múltiplas sessões simultâneas
  - Gerenciamento de QR Code em tempo real
  - Webhooks para integração externa
  - Monitoramento de status e saúde dos bots

### 🔧 Melhorado
- **Segurança**: Migração de chaves secretas para variáveis de ambiente
  - SECRET_KEY e JWT_SECRET_KEY agora são configuráveis
  - Arquivo .env para configurações sensíveis
  - Validação de variáveis de ambiente

- **Gerenciamento de Bots**: Sistema robusto de controle de instâncias
  - Melhor captura e exibição de QR Code
  - Persistência de sessões WhatsApp
  - Monitoramento em tempo real do status
  - Logs detalhados de operações

- **Interface do Usuário**: Componentes aprimorados e responsivos
  - Componente DateRangePicker para seleção de períodos
  - Badges e indicadores de status melhorados
  - Animações e transições suaves
  - Feedback visual para ações do usuário

### 🛠️ Técnico
- **Dependências Adicionadas**:
  - `reactflow` - Editor visual de fluxos
  - `recharts` - Gráficos e visualizações
  - `date-fns` - Manipulação de datas
  - `requests` - Cliente HTTP para Python
  - `python-dotenv` - Carregamento de variáveis de ambiente

- **Estrutura de Arquivos**:
  - `/src/components/flow/` - Componentes do editor de fluxos
  - `/src/whatsapp_module/` - Módulo WhatsApp integrado
  - `/instance/` - Diretório para banco de dados
  - Organização melhorada de rotas e modelos

### 🔄 Alterado
- **Roteamento**: Novas rotas para páginas implementadas
  - `/messages` - Página de mensagens
  - `/reports` - Página de relatórios
  - `/bots/:botId/flows/:flowId` - Editor de fluxos

- **API**: Endpoints expandidos para novas funcionalidades
  - Endpoints de fluxos e nós
  - APIs de mensagens e relatórios
  - Integração com módulo WhatsApp

### 🗑️ Removido
- **Dependência Externa**: Eliminação da dependência do diretório `bot-zdg`
  - Funcionalidades migradas para módulo integrado
  - Sistema agora é completamente autossuficiente

## [1.0.0] - 2025-01-20

### 🎉 Adicionado
- **Sistema Base**: Estrutura inicial do projeto
  - Backend Flask com SQLAlchemy
  - Frontend React com Vite
  - Sistema de autenticação JWT
  - Modelos de dados básicos (User, Bot, Flow)

- **Interface Inicial**: Páginas básicas implementadas
  - Login e registro de usuários
  - Dashboard principal
  - Página de bots (listagem básica)
  - Layout responsivo com Tailwind CSS

- **Funcionalidades Core**: Recursos essenciais
  - CRUD de usuários e bots
  - Sistema de rotas protegidas
  - Integração básica com WhatsApp Web
  - Banco de dados SQLite

### 🛠️ Técnico
- **Stack Tecnológico**:
  - Backend: Flask, SQLAlchemy, Flask-JWT-Extended
  - Frontend: React, Vite, Tailwind CSS, Shadcn/ui
  - Banco: SQLite
  - Autenticação: JWT

---

## Tipos de Mudanças
- `🎉 Adicionado` para novas funcionalidades
- `🔧 Melhorado` para mudanças em funcionalidades existentes
- `🗑️ Removido` para funcionalidades removidas
- `🔄 Alterado` para mudanças que não se encaixam nas categorias acima
- `🛠️ Técnico` para mudanças técnicas e de infraestrutura
- `🐛 Corrigido` para correção de bugs
- `🔒 Segurança` para vulnerabilidades corrigidas

