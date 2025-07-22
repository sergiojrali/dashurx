from flask import Blueprint, request, jsonify, render_template_string
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.models.bot import Bot
import subprocess
import os
import json
import signal
import psutil

whatsapp_sessions_bp = Blueprint('whatsapp_sessions', __name__)

# Armazenar processos ativos
active_sessions = {}

@whatsapp_sessions_bp.route('/sessions', methods=['GET'])
@jwt_required()
def get_sessions():
    """Listar todas as sessões do usuário"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Buscar bots do usuário
        bots = Bot.query.filter_by(user_id=int(user_id)).all()
        
        sessions = []
        for bot in bots:
            session_info = {
                'id': str(bot.id),
                'description': bot.name,
                'status': bot.status,
                'qr_code': bot.qr_code,
                'ready': bot.status == 'active',
                'port': 8000 + bot.id
            }
            sessions.append(session_info)
        
        return jsonify({
            'sessions': sessions,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Erro ao listar sessões: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_sessions_bp.route('/sessions', methods=['POST'])
@jwt_required()
def create_session():
    """Criar nova sessão do WhatsApp"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        data = request.get_json()
        
        if not data.get('description'):
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        description = data['description'].strip()
        
        # Criar novo bot
        bot = Bot(
            name=description,
            user_id=int(user_id),
            status='inactive'
        )
        
        db.session.add(bot)
        db.session.commit()
        
        return jsonify({
            'message': 'Sessão criada com sucesso',
            'session': {
                'id': str(bot.id),
                'description': bot.name,
                'status': bot.status,
                'ready': False,
                'port': 8000 + bot.id
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro ao criar sessão: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_sessions_bp.route('/sessions/<session_id>/start', methods=['POST'])
@jwt_required()
def start_session(session_id):
    """Iniciar sessão do WhatsApp"""
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=int(session_id), user_id=int(user_id)).first()
        
        if not bot:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Verificar se já está rodando
        if session_id in active_sessions:
            return jsonify({'error': 'Sessão já está ativa'}), 400
        
        # Iniciar processo Node.js
        try:
            port = 8000 + bot.id
            webhook_url = f"http://localhost:5000/api/whatsapp/webhook/{bot.id}"
            
            # Comando para iniciar o bot
            cmd = [
                'node',
                '/home/ubuntu/dashurx/whatsapp-saas-backend/src/whatsapp_module/whatsapp_bot.js',
                str(bot.id),
                str(port),
                webhook_url
            ]
            
            # Iniciar processo
            process = subprocess.Popen(
                cmd,
                cwd='/home/ubuntu/dashurx/whatsapp-saas-backend',
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                preexec_fn=os.setsid
            )
            
            # Armazenar processo
            active_sessions[session_id] = {
                'process': process,
                'port': port,
                'bot_id': bot.id
            }
            
            # Atualizar status no banco
            bot.status = 'connecting'
            db.session.commit()
            
            return jsonify({
                'message': 'Sessão iniciada com sucesso',
                'status': 'connecting',
                'port': port
            }), 200
            
        except Exception as e:
            print(f"[ERROR] Erro ao iniciar processo: {e}")
            return jsonify({'error': 'Falha ao iniciar sessão'}), 500
        
    except Exception as e:
        print(f"[ERROR] Erro ao iniciar sessão: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_sessions_bp.route('/sessions/<session_id>/stop', methods=['POST'])
@jwt_required()
def stop_session(session_id):
    """Parar sessão do WhatsApp"""
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=int(session_id), user_id=int(user_id)).first()
        
        if not bot:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Parar processo se estiver rodando
        if session_id in active_sessions:
            try:
                process = active_sessions[session_id]['process']
                
                # Tentar parar graciosamente
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
                
                # Aguardar um pouco
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    # Forçar parada se necessário
                    os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                
                # Remover da lista de sessões ativas
                del active_sessions[session_id]
                
            except Exception as e:
                print(f"[ERROR] Erro ao parar processo: {e}")
        
        # Atualizar status no banco
        bot.status = 'inactive'
        bot.qr_code = None
        db.session.commit()
        
        return jsonify({
            'message': 'Sessão parada com sucesso',
            'status': 'inactive'
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Erro ao parar sessão: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_sessions_bp.route('/sessions/<session_id>/status', methods=['GET'])
@jwt_required()
def get_session_status(session_id):
    """Obter status da sessão"""
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=int(session_id), user_id=int(user_id)).first()
        
        if not bot:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Verificar se o processo ainda está rodando
        is_running = False
        if session_id in active_sessions:
            try:
                process = active_sessions[session_id]['process']
                is_running = process.poll() is None
                
                if not is_running:
                    # Processo morreu, remover da lista
                    del active_sessions[session_id]
                    bot.status = 'inactive'
                    bot.qr_code = None
                    db.session.commit()
            except:
                is_running = False
        
        # Tentar obter QR code se estiver conectando
        qr_code = None
        if is_running and session_id in active_sessions:
            try:
                import requests
                port = active_sessions[session_id]['port']
                response = requests.get(f'http://localhost:{port}/qr', timeout=2)
                if response.status_code == 200:
                    qr_data = response.json()
                    if qr_data.get('status') and qr_data.get('qrCode'):
                        qr_code = qr_data['qrCode']
                        
                        # Atualizar no banco se mudou
                        if bot.qr_code != qr_code:
                            bot.qr_code = qr_code
                            db.status = 'qr_ready'
                            db.session.commit()
            except:
                pass
        
        return jsonify({
            'id': session_id,
            'status': bot.status,
            'qr_code': bot.qr_code,
            'ready': bot.status == 'active',
            'running': is_running,
            'port': 8000 + bot.id if is_running else None
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Erro ao obter status: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_sessions_bp.route('/sessions/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    """Deletar sessão do WhatsApp"""
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=int(session_id), user_id=int(user_id)).first()
        
        if not bot:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        # Parar processo se estiver rodando
        if session_id in active_sessions:
            try:
                process = active_sessions[session_id]['process']
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                del active_sessions[session_id]
            except:
                pass
        
        # Deletar do banco
        db.session.delete(bot)
        db.session.commit()
        
        return jsonify({
            'message': 'Sessão deletada com sucesso'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] Erro ao deletar sessão: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_sessions_bp.route('/sessions/<session_id>/send-message', methods=['POST'])
@jwt_required()
def send_message_session(session_id):
    """Enviar mensagem através da sessão"""
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=int(session_id), user_id=int(user_id)).first()
        
        if not bot:
            return jsonify({'error': 'Sessão não encontrada'}), 404
        
        if session_id not in active_sessions:
            return jsonify({'error': 'Sessão não está ativa'}), 400
        
        data = request.get_json()
        
        if not data.get('number') or not data.get('message'):
            return jsonify({'error': 'Número e mensagem são obrigatórios'}), 400
        
        # Enviar mensagem via API do bot
        try:
            import requests
            port = active_sessions[session_id]['port']
            
            response = requests.post(f'http://localhost:{port}/send-message', 
                json={
                    'number': data['number'],
                    'message': data['message']
                },
                timeout=10
            )
            
            if response.status_code == 200:
                return jsonify({
                    'message': 'Mensagem enviada com sucesso',
                    'response': response.json()
                }), 200
            else:
                return jsonify({
                    'error': 'Falha ao enviar mensagem',
                    'details': response.text
                }), response.status_code
                
        except Exception as e:
            print(f"[ERROR] Erro ao enviar mensagem: {e}")
            return jsonify({'error': 'Falha na comunicação com o bot'}), 500
        
    except Exception as e:
        print(f"[ERROR] Erro ao enviar mensagem: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Interface web para gerenciar sessões
@whatsapp_sessions_bp.route('/interface')
@jwt_required()
def whatsapp_interface():
    """Interface web para gerenciar sessões do WhatsApp"""
    html_template = """
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciador de Sessões WhatsApp</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #eee;
        }
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .btn-primary {
            background-color: #007bff;
            color: white;
        }
        .btn-primary:hover {
            background-color: #0056b3;
        }
        .btn-success {
            background-color: #28a745;
            color: white;
        }
        .btn-success:hover {
            background-color: #1e7e34;
        }
        .btn-danger {
            background-color: #dc3545;
            color: white;
        }
        .btn-danger:hover {
            background-color: #c82333;
        }
        .btn-warning {
            background-color: #ffc107;
            color: #212529;
        }
        .btn-warning:hover {
            background-color: #e0a800;
        }
        .sessions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .session-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            background: #f8f9fa;
        }
        .session-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .session-title {
            font-weight: bold;
            font-size: 16px;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        }
        .status-active {
            background-color: #d4edda;
            color: #155724;
        }
        .status-connecting {
            background-color: #fff3cd;
            color: #856404;
        }
        .status-inactive {
            background-color: #f8d7da;
            color: #721c24;
        }
        .qr-container {
            text-align: center;
            margin: 15px 0;
        }
        .qr-code {
            max-width: 200px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .session-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        .session-actions .btn {
            flex: 1;
            font-size: 12px;
            padding: 8px 12px;
        }
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }
        .modal-content {
            background-color: white;
            margin: 15% auto;
            padding: 20px;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .modal-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .loading {
            text-align: center;
            padding: 20px;
            color: #666;
        }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Gerenciador de Sessões WhatsApp</h1>
            <button class="btn btn-primary" onclick="showCreateModal()">
                + Nova Sessão
            </button>
        </div>
        
        <div id="loading" class="loading">
            Carregando sessões...
        </div>
        
        <div id="sessions-container" class="sessions-grid" style="display: none;">
        </div>
        
        <div id="empty-state" class="empty-state" style="display: none;">
            <h3>Nenhuma sessão encontrada</h3>
            <p>Clique em "Nova Sessão" para criar sua primeira sessão do WhatsApp</p>
        </div>
    </div>

    <!-- Modal para criar sessão -->
    <div id="createModal" class="modal">
        <div class="modal-content">
            <h3>Nova Sessão WhatsApp</h3>
            <div class="form-group">
                <label for="sessionDescription">Descrição da Sessão:</label>
                <input type="text" id="sessionDescription" placeholder="Ex: Bot Atendimento, Bot Vendas...">
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="createSession()">Criar</button>
                <button class="btn" onclick="hideCreateModal()">Cancelar</button>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = '/api/whatsapp-sessions';
        let sessions = [];
        let refreshInterval;

        // Obter token JWT do localStorage (assumindo que está armazenado lá)
        function getAuthToken() {
            return localStorage.getItem('access_token');
        }

        // Fazer requisição autenticada
        async function apiRequest(url, options = {}) {
            const token = getAuthToken();
            if (!token) {
                alert('Token de autenticação não encontrado. Faça login novamente.');
                return null;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            };

            try {
                const response = await fetch(url, {
                    ...options,
                    headers
                });

                if (response.status === 401) {
                    alert('Sessão expirada. Faça login novamente.');
                    return null;
                }

                return response;
            } catch (error) {
                console.error('Erro na requisição:', error);
                return null;
            }
        }

        // Carregar sessões
        async function loadSessions() {
            const response = await apiRequest(`${API_BASE}/sessions`);
            if (!response) return;

            if (response.ok) {
                const data = await response.json();
                sessions = data.sessions;
                renderSessions();
            } else {
                console.error('Erro ao carregar sessões');
            }
        }

        // Renderizar sessões
        function renderSessions() {
            const container = document.getElementById('sessions-container');
            const loading = document.getElementById('loading');
            const emptyState = document.getElementById('empty-state');

            loading.style.display = 'none';

            if (sessions.length === 0) {
                container.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            container.style.display = 'grid';

            container.innerHTML = sessions.map(session => `
                <div class="session-card">
                    <div class="session-header">
                        <div class="session-title">${session.description}</div>
                        <div class="status-badge status-${session.status}">
                            ${getStatusText(session.status)}
                        </div>
                    </div>
                    
                    <div>
                        <strong>ID:</strong> ${session.id}<br>
                        <strong>Porta:</strong> ${session.port}
                    </div>
                    
                    ${session.qr_code ? `
                        <div class="qr-container">
                            <p><strong>Escaneie o QR Code:</strong></p>
                            <img src="${session.qr_code}" alt="QR Code" class="qr-code">
                        </div>
                    ` : ''}
                    
                    <div class="session-actions">
                        ${session.status === 'inactive' ? 
                            `<button class="btn btn-success" onclick="startSession('${session.id}')">Iniciar</button>` :
                            `<button class="btn btn-warning" onclick="stopSession('${session.id}')">Parar</button>`
                        }
                        <button class="btn btn-primary" onclick="refreshSession('${session.id}')">Atualizar</button>
                        <button class="btn btn-danger" onclick="deleteSession('${session.id}')">Deletar</button>
                    </div>
                </div>
            `).join('');
        }

        // Obter texto do status
        function getStatusText(status) {
            const statusMap = {
                'active': 'Ativo',
                'connecting': 'Conectando',
                'qr_ready': 'QR Pronto',
                'inactive': 'Inativo',
                'error': 'Erro'
            };
            return statusMap[status] || status;
        }

        // Criar sessão
        async function createSession() {
            const description = document.getElementById('sessionDescription').value.trim();
            
            if (!description) {
                alert('Por favor, insira uma descrição para a sessão');
                return;
            }

            const response = await apiRequest(`${API_BASE}/sessions`, {
                method: 'POST',
                body: JSON.stringify({ description })
            });

            if (response && response.ok) {
                hideCreateModal();
                loadSessions();
                alert('Sessão criada com sucesso!');
            } else {
                alert('Erro ao criar sessão');
            }
        }

        // Iniciar sessão
        async function startSession(sessionId) {
            const response = await apiRequest(`${API_BASE}/sessions/${sessionId}/start`, {
                method: 'POST'
            });

            if (response && response.ok) {
                loadSessions();
                alert('Sessão iniciada com sucesso!');
            } else {
                alert('Erro ao iniciar sessão');
            }
        }

        // Parar sessão
        async function stopSession(sessionId) {
            if (!confirm('Tem certeza que deseja parar esta sessão?')) return;

            const response = await apiRequest(`${API_BASE}/sessions/${sessionId}/stop`, {
                method: 'POST'
            });

            if (response && response.ok) {
                loadSessions();
                alert('Sessão parada com sucesso!');
            } else {
                alert('Erro ao parar sessão');
            }
        }

        // Atualizar sessão
        async function refreshSession(sessionId) {
            const response = await apiRequest(`${API_BASE}/sessions/${sessionId}/status`);
            if (response && response.ok) {
                loadSessions();
            }
        }

        // Deletar sessão
        async function deleteSession(sessionId) {
            if (!confirm('Tem certeza que deseja deletar esta sessão? Esta ação não pode ser desfeita.')) return;

            const response = await apiRequest(`${API_BASE}/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            if (response && response.ok) {
                loadSessions();
                alert('Sessão deletada com sucesso!');
            } else {
                alert('Erro ao deletar sessão');
            }
        }

        // Modal functions
        function showCreateModal() {
            document.getElementById('createModal').style.display = 'block';
            document.getElementById('sessionDescription').value = '';
        }

        function hideCreateModal() {
            document.getElementById('createModal').style.display = 'none';
        }

        // Fechar modal ao clicar fora
        window.onclick = function(event) {
            const modal = document.getElementById('createModal');
            if (event.target === modal) {
                hideCreateModal();
            }
        }

        // Inicializar
        document.addEventListener('DOMContentLoaded', function() {
            loadSessions();
            
            // Atualizar sessões a cada 5 segundos
            refreshInterval = setInterval(loadSessions, 5000);
        });

        // Limpar interval ao sair da página
        window.addEventListener('beforeunload', function() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        });
    </script>
</body>
</html>
    """
    
    return render_template_string(html_template)

