from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.models.bot import Bot, Message
from src.whatsapp_manager import whatsapp_manager

whatsapp_bp = Blueprint('whatsapp', __name__)

@whatsapp_bp.route('/bots/<int:bot_id>/start', methods=['POST'])
@jwt_required()
def start_bot(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        # Iniciar instância do WhatsApp
        success = whatsapp_manager.create_instance(bot_id, bot.to_dict())
        
        if success:
            bot.status = 'connecting'
            db.session.commit()
            
            return jsonify({
                'message': 'Bot iniciado com sucesso',
                'status': 'connecting'
            }), 200
        else:
            return jsonify({'error': 'Falha ao iniciar o bot'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_bp.route('/bots/<int:bot_id>/stop', methods=['POST'])
@jwt_required()
def stop_bot(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        # Parar instância do WhatsApp
        success = whatsapp_manager.stop_instance(bot_id)
        
        if success:
            bot.status = 'inactive'
            bot.qr_code = None
            db.session.commit()
            
            return jsonify({
                'message': 'Bot parado com sucesso',
                'status': 'inactive'
            }), 200
        else:
            return jsonify({'error': 'Falha ao parar o bot'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_bp.route('/bots/<int:bot_id>/status', methods=['GET'])
@jwt_required()
def get_bot_status(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        # Verificar status da instância
        instance_status = whatsapp_manager.get_instance_status(bot_id)
        
        if instance_status:
            # Atualizar status no banco se necessário
            if bot.status != instance_status:
                bot.status = instance_status
                db.session.commit()
        
        # Verificar QR code
        qr_code = whatsapp_manager.get_instance_qr(bot_id)
        if qr_code and qr_code != bot.qr_code:
            bot.qr_code = qr_code
            db.session.commit()
        
        return jsonify({
            'status': bot.status,
            'qr_code': bot.qr_code
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_bp.route('/bots/<int:bot_id>/send-message', methods=['POST'])
@jwt_required()
def send_whatsapp_message(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('number') or not data.get('message'):
            return jsonify({'error': 'Número e mensagem são obrigatórios'}), 400
        
        number = data['number'].strip()
        message = data['message'].strip()
        
        # Verificar se o bot está ativo
        if bot.status != 'active':
            return jsonify({'error': 'Bot não está ativo'}), 400
        
        # Enviar mensagem através do gerenciador
        success = whatsapp_manager.send_message(bot_id, number, message)
        
        if success:
            # Salvar mensagem no banco
            msg_record = Message(
                bot_id=bot_id,
                contact_number=number,
                content=message,
                message_type='text',
                direction='outgoing',
                status='sent'
            )
            db.session.add(msg_record)
            db.session.commit()
            
            return jsonify({
                'message': 'Mensagem enviada com sucesso',
                'message_data': msg_record.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Falha ao enviar mensagem'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_bp.route('/bots/<int:bot_id>/send-media', methods=['POST'])
@jwt_required()
def send_whatsapp_media(bot_id):
    try:
        user_id = get_jwt_identity()
        bot = Bot.query.filter_by(id=bot_id, user_id=user_id).first()
        
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('number') or not data.get('file_url'):
            return jsonify({'error': 'Número e URL do arquivo são obrigatórios'}), 400
        
        number = data['number'].strip()
        file_url = data['file_url'].strip()
        caption = data.get('caption', '').strip()
        
        # Verificar se o bot está ativo
        if bot.status != 'active':
            return jsonify({'error': 'Bot não está ativo'}), 400
        
        # Enviar mídia através do gerenciador
        success = whatsapp_manager.send_media(bot_id, number, file_url, caption)
        
        if success:
            # Salvar mensagem no banco
            msg_record = Message(
                bot_id=bot_id,
                contact_number=number,
                content=caption,
                media_url=file_url,
                message_type='media',
                direction='outgoing',
                status='sent'
            )
            db.session.add(msg_record)
            db.session.commit()
            
            return jsonify({
                'message': 'Mídia enviada com sucesso',
                'message_data': msg_record.to_dict()
            }), 200
        else:
            return jsonify({'error': 'Falha ao enviar mídia'}), 500
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@whatsapp_bp.route('/webhook/<int:bot_id>', methods=['POST'])
def webhook_receiver(bot_id):
    """Recebe webhooks das instâncias de bots"""
    try:
        data = request.get_json()
        
        # Verificar se o bot existe
        bot = Bot.query.get(bot_id)
        if not bot:
            return jsonify({'error': 'Bot não encontrado'}), 404
        
        # Processar mensagem recebida
        message_data = data.get('message', {})
        
        if message_data:
            # Salvar mensagem no banco
            msg_record = Message(
                bot_id=bot_id,
                contact_number=message_data.get('from', ''),
                content=message_data.get('body', ''),
                message_type=message_data.get('type', 'text'),
                direction='incoming'
            )
            db.session.add(msg_record)
            db.session.commit()
            
            # Aqui você pode implementar lógica de processamento de fluxos
            # Por exemplo, verificar se a mensagem corresponde a algum trigger
            # e executar o fluxo correspondente
        
        return jsonify({'status': 'received'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

