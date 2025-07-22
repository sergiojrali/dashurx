from datetime import datetime
import json
from . import db

class Bot(db.Model):
    __tablename__ = 'bots'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    phone_number = db.Column(db.String(20), unique=True)
    status = db.Column(db.String(20), default='inactive')  # inactive, active, connecting, error
    qr_code = db.Column(db.Text)  # Base64 QR code
    session_data = db.Column(db.Text)  # JSON session data
    webhook_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    user = db.relationship('User', back_populates='bots')
    flows = db.relationship('Flow', backref='bot', lazy=True, cascade='all, delete-orphan')
    messages = db.relationship('Message', backref='bot', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'user_id': self.user_id,
            'phone_number': self.phone_number,
            'status': self.status,
            'qr_code': self.qr_code,
            'webhook_url': self.webhook_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class Flow(db.Model):
    __tablename__ = 'flows'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    bot_id = db.Column(db.Integer, db.ForeignKey('bots.id'), nullable=False)
    trigger_type = db.Column(db.String(50), nullable=False)  # message, keyword, media, etc.
    trigger_value = db.Column(db.String(255))  # keyword, pattern, etc.
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    nodes = db.relationship('FlowNode', backref='flow', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'bot_id': self.bot_id,
            'trigger_type': self.trigger_type,
            'trigger_value': self.trigger_value,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'nodes': [node.to_dict() for node in self.nodes]
        }

class FlowNode(db.Model):
    __tablename__ = 'flow_nodes'
    
    id = db.Column(db.Integer, primary_key=True)
    flow_id = db.Column(db.Integer, db.ForeignKey('flows.id'), nullable=False)
    node_type = db.Column(db.String(50), nullable=False)  # message, condition, action, delay, etc.
    node_data = db.Column(db.Text)  # JSON data for the node
    position_x = db.Column(db.Float, default=0)
    position_y = db.Column(db.Float, default=0)
    order_index = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    connections_from = db.relationship('NodeConnection', foreign_keys='NodeConnection.from_node_id', backref='from_node', lazy=True, cascade='all, delete-orphan')
    connections_to = db.relationship('NodeConnection', foreign_keys='NodeConnection.to_node_id', backref='to_node', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        node_data = {}
        if self.node_data:
            try:
                node_data = json.loads(self.node_data)
            except:
                node_data = {}
                
        return {
            'id': self.id,
            'flow_id': self.flow_id,
            'node_type': self.node_type,
            'node_data': node_data,
            'position_x': self.position_x,
            'position_y': self.position_y,
            'order_index': self.order_index,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class NodeConnection(db.Model):
    __tablename__ = 'node_connections'
    
    id = db.Column(db.Integer, primary_key=True)
    from_node_id = db.Column(db.Integer, db.ForeignKey('flow_nodes.id'), nullable=False)
    to_node_id = db.Column(db.Integer, db.ForeignKey('flow_nodes.id'), nullable=False)
    condition_type = db.Column(db.String(50))  # equals, contains, regex, etc.
    condition_value = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'from_node_id': self.from_node_id,
            'to_node_id': self.to_node_id,
            'condition_type': self.condition_type,
            'condition_value': self.condition_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.Integer, primary_key=True)
    bot_id = db.Column(db.Integer, db.ForeignKey('bots.id'), nullable=False)
    contact_number = db.Column(db.String(20), nullable=False)
    contact_name = db.Column(db.String(100))
    message_type = db.Column(db.String(20), nullable=False)  # text, image, audio, video, document
    content = db.Column(db.Text)
    media_url = db.Column(db.String(255))
    direction = db.Column(db.String(10), nullable=False)  # incoming, outgoing
    status = db.Column(db.String(20), default='sent')  # sent, delivered, read, failed
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'bot_id': self.bot_id,
            'contact_number': self.contact_number,
            'contact_name': self.contact_name,
            'message_type': self.message_type,
            'content': self.content,
            'media_url': self.media_url,
            'direction': self.direction,
            'status': self.status,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

