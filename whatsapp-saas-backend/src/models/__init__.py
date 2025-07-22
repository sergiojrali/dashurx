from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Importar os modelos depois da criação do db para evitar importação circular
from .user import User
from .bot import Bot, Flow, FlowNode, NodeConnection, Message
