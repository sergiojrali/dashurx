from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.models.bot import Bot, Flow, FlowNode, NodeConnection
import json

flows_bp = Blueprint('flows', __name__)

@flows_bp.route('/flows/<int:flow_id>', methods=['GET'])
@jwt_required()
def get_flow(flow_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo
        flow = db.session.query(Flow).join(Bot).filter(
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not flow:
            return jsonify({'error': 'Fluxo não encontrado'}), 404
        
        return jsonify({'flow': flow.to_dict()}), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>', methods=['PUT'])
@jwt_required()
def update_flow(flow_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo
        flow = db.session.query(Flow).join(Bot).filter(
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not flow:
            return jsonify({'error': 'Fluxo não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Nome do fluxo é obrigatório'}), 400
            flow.name = name
            
        if 'description' in data:
            flow.description = data['description'].strip()
            
        if 'trigger_type' in data:
            flow.trigger_type = data['trigger_type'].strip()
            
        if 'trigger_value' in data:
            flow.trigger_value = data['trigger_value'].strip()
            
        if 'is_active' in data:
            flow.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Fluxo atualizado com sucesso',
            'flow': flow.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>', methods=['DELETE'])
@jwt_required()
def delete_flow(flow_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo
        flow = db.session.query(Flow).join(Bot).filter(
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not flow:
            return jsonify({'error': 'Fluxo não encontrado'}), 404
        
        db.session.delete(flow)
        db.session.commit()
        
        return jsonify({'message': 'Fluxo excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>/nodes', methods=['GET'])
@jwt_required()
def get_flow_nodes(flow_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo
        flow = db.session.query(Flow).join(Bot).filter(
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not flow:
            return jsonify({'error': 'Fluxo não encontrado'}), 404
        
        nodes = FlowNode.query.filter_by(flow_id=flow_id).order_by(FlowNode.order_index).all()
        connections = NodeConnection.query.join(FlowNode).filter(FlowNode.flow_id == flow_id).all()
        
        return jsonify({
            'nodes': [node.to_dict() for node in nodes],
            'connections': [connection.to_dict() for connection in connections]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>/nodes', methods=['POST'])
@jwt_required()
def create_flow_node(flow_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo
        flow = db.session.query(Flow).join(Bot).filter(
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not flow:
            return jsonify({'error': 'Fluxo não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('node_type'):
            return jsonify({'error': 'Tipo do nó é obrigatório'}), 400
        
        node_type = data['node_type'].strip()
        node_data = data.get('node_data', {})
        position_x = data.get('position_x', 0)
        position_y = data.get('position_y', 0)
        order_index = data.get('order_index', 0)
        
        # Criar novo nó
        node = FlowNode(
            flow_id=flow_id,
            node_type=node_type,
            node_data=json.dumps(node_data),
            position_x=position_x,
            position_y=position_y,
            order_index=order_index
        )
        
        db.session.add(node)
        db.session.commit()
        
        return jsonify({
            'message': 'Nó criado com sucesso',
            'node': node.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>/nodes/<int:node_id>', methods=['PUT'])
@jwt_required()
def update_flow_node(flow_id, node_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo e nó
        node = db.session.query(FlowNode).join(Flow).join(Bot).filter(
            FlowNode.id == node_id,
            FlowNode.flow_id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not node:
            return jsonify({'error': 'Nó não encontrado'}), 404
        
        data = request.get_json()
        
        # Atualizar campos permitidos
        if 'node_type' in data:
            node.node_type = data['node_type'].strip()
            
        if 'node_data' in data:
            node.node_data = json.dumps(data['node_data'])
            
        if 'position_x' in data:
            node.position_x = data['position_x']
            
        if 'position_y' in data:
            node.position_y = data['position_y']
            
        if 'order_index' in data:
            node.order_index = data['order_index']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Nó atualizado com sucesso',
            'node': node.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>/nodes/<int:node_id>', methods=['DELETE'])
@jwt_required()
def delete_flow_node(flow_id, node_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo e nó
        node = db.session.query(FlowNode).join(Flow).join(Bot).filter(
            FlowNode.id == node_id,
            FlowNode.flow_id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not node:
            return jsonify({'error': 'Nó não encontrado'}), 404
        
        db.session.delete(node)
        db.session.commit()
        
        return jsonify({'message': 'Nó excluído com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>/connections', methods=['POST'])
@jwt_required()
def create_node_connection(flow_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso ao fluxo
        flow = db.session.query(Flow).join(Bot).filter(
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not flow:
            return jsonify({'error': 'Fluxo não encontrado'}), 404
        
        data = request.get_json()
        
        # Validação dos campos obrigatórios
        if not data.get('from_node_id') or not data.get('to_node_id'):
            return jsonify({'error': 'Nós de origem e destino são obrigatórios'}), 400
        
        from_node_id = data['from_node_id']
        to_node_id = data['to_node_id']
        condition_type = data.get('condition_type', '')
        condition_value = data.get('condition_value', '')
        
        # Verificar se os nós existem e pertencem ao fluxo
        from_node = FlowNode.query.filter_by(id=from_node_id, flow_id=flow_id).first()
        to_node = FlowNode.query.filter_by(id=to_node_id, flow_id=flow_id).first()
        
        if not from_node or not to_node:
            return jsonify({'error': 'Nós inválidos'}), 400
        
        # Criar nova conexão
        connection = NodeConnection(
            from_node_id=from_node_id,
            to_node_id=to_node_id,
            condition_type=condition_type,
            condition_value=condition_value
        )
        
        db.session.add(connection)
        db.session.commit()
        
        return jsonify({
            'message': 'Conexão criada com sucesso',
            'connection': connection.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

@flows_bp.route('/flows/<int:flow_id>/connections/<int:connection_id>', methods=['DELETE'])
@jwt_required()
def delete_node_connection(flow_id, connection_id):
    try:
        user_id = get_jwt_identity()
        
        # Verificar se o usuário tem acesso à conexão
        connection = db.session.query(NodeConnection).join(
            FlowNode, NodeConnection.from_node_id == FlowNode.id
        ).join(Flow).join(Bot).filter(
            NodeConnection.id == connection_id,
            Flow.id == flow_id,
            Bot.user_id == user_id
        ).first()
        
        if not connection:
            return jsonify({'error': 'Conexão não encontrada'}), 404
        
        db.session.delete(connection)
        db.session.commit()
        
        return jsonify({'message': 'Conexão excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Erro interno do servidor'}), 500

