from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from flask_migrate import Migrate


class Base(DeclarativeBase, MappedAsDataclass):
    pass


db = SQLAlchemy(model_class=Base)
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*")
migrate = Migrate()
