from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.models.bot import Bot, Flow, FlowNode, NodeConnection, Message
import json

bots_bp = Blueprint('bots', __name__)

@bots_bp.route('/bots', methods=['GET'])
@jwt_required()
def get_bots():
    try:
        user_id = get_jwt_identity()
        bots = Bot.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'bots': [bot.to_dict() for bot in bots]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots', methods=['POST'])
@jwt_required()
def create_bot():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('name'):
            return jsonify({'error': 'Nome do bot é obrigatório'}), 400
        
        name = data['name'].strip()
        description = data.get('description', '').strip()
        phone_number = data.get('phone_number', '').strip()
        webhook_url = data.get('webhook_url', '').strip()
        
        # Verificar se o número de telefone já está em uso
        if phone_number:
            existing_bot = Bot.query.filter_by(phone_number=phone_number).first()
            if existing_bot:
                return jsonify({'error': 'Número de telefone já está em uso'}), 400
        
        # Criar novo bot
        bot = Bot(
            name=name,
            description=description,
            user_id=user_id,
            phone_number=phone_number,
            webhook_url=webhook_url
        )
        
        db.session.add(bot)
        db.session.commit()
        
        return jsonify({
            'message': 'Bot criado com sucesso',
            'bot': bot.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>', methods=['GET'])
@jwt_required()
def get_bot(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        return jsonify({'bot': bot.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>', methods=['PUT'])
@jwt_required()
def update_bot(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Nome do bot é obrigatório'}), 400
            bot.name = name
            
        if 'description' in data:
            bot.description = data['description'].strip()
            
        if 'phone_number' in data:
            phone_number = data['phone_number'].strip()
            # Verificar se o número já está em uso por outro bot
            if phone_number:
                existing_bot = Bot.query.filter(
                    Bot.phone_number == phone_number,
                    Bot.id != bot_id
                ).first()
                if existing_bot:
                    return jsonify({'error': 'Número de telefone já está em uso'}), 400
            bot.phone_number = phone_number
            
        if 'webhook_url' in data:
            bot.webhook_url = data['webhook_url'].strip()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Bot atualizado com sucesso',
            'bot': bot.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>', methods=['DELETE'])
@jwt_required()
def delete_bot(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        db.session.delete(bot)
        db.session.commit()
        
        return jsonify({'message': 'Bot excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>/status', methods=['PUT'])
@jwt_required()
def update_bot_status(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['inactive', 'active', 'connecting', 'error']:
            return jsonify({'error': 'Status inválido'}), 400
        
        bot.status = status
        
        # Atualizar QR code se fornecido
        if 'qr_code' in data:
            bot.qr_code = data['qr_code']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Status do bot atualizado com sucesso',
            'bot': bot.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>/flows', methods=['GET'])
@jwt_required()
def get_bot_flows(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        flows = Flow.query.filter_by(bot_id=bot_id).all()
        
        return jsonify({
            'flows': [flow.to_dict() for flow in flows]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>/flows', methods=['POST'])
@jwt_required()
def create_flow(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('name') or not data.get('trigger_type'):
            return jsonify({'error': 'Nome e tipo de trigger são obrigatórios'}), 400
        
        name = data['name'].strip()
        description = data.get('description', '').strip()
        trigger_type = data['trigger_type'].strip()
        trigger_value = data.get('trigger_value', '').strip()
        
        # Criar novo fluxo
        flow = Flow(
            name=name,
            description=description,
            bot_id=bot_id,
            trigger_type=trigger_type,
            trigger_value=trigger_value
        )
        
        db.session.add(flow)
        db.session.commit()
        
        return jsonify({
            'message': 'Fluxo criado com sucesso',
            'flow': flow.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>/messages', methods=['GET'])
@jwt_required()
def get_bot_messages(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        # Parâmetros de paginação
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        contact_number = request.args.get('contact_number')
        
        query = Message.query.filter_by(bot_id=bot_id)
        
        if contact_number:
            query = query.filter_by(contact_number=contact_number)
        
        messages = query.order_by(Message.timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'messages': [message.to_dict() for message in messages.items],
            'total': messages.total,
            'pages': messages.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@bots_bp.route('/bots/<int:bot_id>/send-message', methods=['POST'])
@jwt_required()
def send_message(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('contact_number') or not data.get('content'):
            return jsonify({'error': 'Número do contato e conteúdo são obrigatórios'}), 400
        
        contact_number = data['contact_number'].strip()
        content = data['content'].strip()
        message_type = data.get('message_type', 'text')
        
        # Aqui você integraria com o sistema de WhatsApp
        # Por enquanto, apenas salvamos a mensagem no banco
        
        message = Message(
            bot_id=bot_id,
            contact_number=contact_number,
            content=content,
            message_type=message_type,
            direction='outgoing'
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'message': 'Mensagem enviada com sucesso',
            'message_data': message.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

