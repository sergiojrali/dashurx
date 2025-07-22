# Tarefas para o Projeto DashURX

## Fase 3: Análise detalhada do código e identificação de melhorias
- [x] Analisar `whatsapp-saas-backend/src/main.py`
- [ ] Mover SECRET_KEY e JWT_SECRET_KEY para variáveis de ambiente no backend
- [x] Analisar `whatsapp-saas-backend/src/models/`
- [x] Analisar `whatsapp-saas-backend/src/routes/`
- [x] Analisar `whatsapp-saas-backend/src/whatsapp_manager.py`
- [ ] Tornar o caminho `bot-zdg` configurável no `whatsapp_manager.py`
- [ ] Melhorar o gerenciamento de QR Code e dados de sessão no `whatsapp_manager.py`
- [x] Analisar `whatsapp-saas-frontend/src/main.jsx`
- [x] Analisar `whatsapp-saas-frontend/src/App.jsx`
- [x] Analisar `whatsapp-saas-frontend/src/pages/`
- [x] Analisar `whatsapp-saas-frontend/src/components/`
- [x] Identificar melhorias e novas funcionalidades
- [x] **Melhorias de Segurança:**
  - [x] Mover `SECRET_KEY` e `JWT_SECRET_KEY` para variáveis de ambiente no backend (`whatsapp-saas-backend/src/main.py`).
- [x] **Gerenciamento de Bots:**
  - [x] Melhorar o gerenciamento de QR Code e dados de sessão no `whatsapp_manager.py` (captura, exibição e persistência).
  - [x] Tornar o caminho `bot-zdg` configurável no `whatsapp_manager.py`.
  - [x] Integrar módulo WhatsApp diretamente no sistema (sem dependência externa).
- [x] **Novas Funcionalidades:**
  - [x] Implementar funcionalidade de agendamento de mensagens.
  - [x] Desenvolver interface de criação de fluxos visual (drag-and-drop).
  - [x] Criar página de mensagens completa com filtros e busca.
  - [x] Criar página de relatórios com gráficos e estatísticas.
  - [x] Implementar editor visual de fluxos com ReactFlow.
  - [ ] Implementar notificações em tempo real (WebSockets) para status do bot e novas mensagens.
- [ ] **Escalabilidade e Robustez:**
  - [ ] Adicionar suporte a múltiplos bancos de dados (PostgreSQL, MySQL) no backend.
  - [ ] Melhorar a gestão de erros e logs no backend e frontend.
  - [ ] Otimizar performance do backend e frontend.

## Fase 4: Implementação de novas funcionalidades e melhorias
- [ ] Implementar autenticação de dois fatores (2FA)
- [ ] Adicionar funcionalidade de agendamento de mensagens
- [ ] Melhorar a interface de criação de fluxos (drag-and-drop)
- [ ] Implementar notificações em tempo real (WebSockets)
- [ ] Adicionar suporte a múltiplos bancos de dados (PostgreSQL, MySQL)
- [ ] Melhorar a gestão de erros e logs
- [ ] Otimizar performance do backend e frontend

## Fase 5: Testes e validação do sistema completo
- [ ] Realizar testes unitários
- [ ] Realizar testes de integração
- [ ] Realizar testes de ponta a ponta
- [ ] Testar responsividade em diferentes dispositivos

## Fase 6: Documentação e entrega final
- [ ] Atualizar README.md com novas funcionalidades e instruções de uso
- [ ] Criar documentação técnica detalhada
- [ ] Preparar para deploy em produção


