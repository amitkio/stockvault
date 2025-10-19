from flask import Flask
from app.extensions import db, jwt
from app.config import Config


from app.models import User


def create_app() -> Flask:
    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)

    jwt.init_app(flask_app)
    db.init_app(flask_app)

    from app.api.user.routes import auth_bp

    flask_app.register_blueprint(auth_bp)

    
    from app.routes.portfolio_routes import portfolio_bp

    flask_app.register_blueprint(portfolio_bp)


    @flask_app.after_request
    def add_cors_headers(response):
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add(
            "Access-Control-Allow-Headers", "Content-Type,Authorization"
        )
        response.headers.add(
            "Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS"
        )
        return response

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity: str = jwt_data["sub"]
        return db.session.scalar(db.select(User).filter_by(user_id=identity))

    @flask_app.before_request
    def init_db():
        db.create_all()
        flask_app.before_request_funcs[None].remove(init_db)

    return flask_app
