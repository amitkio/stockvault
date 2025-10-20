from flask import Flask
from app.extensions import db, jwt, socketio
from app.config import Config


from app.models import User


def create_app() -> Flask:
    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)

    jwt.init_app(flask_app)
    db.init_app(flask_app)
    socketio.init_app(flask_app)

    from app.api.user.routes import auth_bp

    flask_app.register_blueprint(auth_bp)

    from app.api.stocks.routes import stocks_bp

    flask_app.register_blueprint(stocks_bp)

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

    with flask_app.app_context():
        from app.tasks.data_fetch import fetch_and_update_stock_data, start_websocket
        import threading

        db.create_all()
        fetch_and_update_stock_data()
        websocket_thread = threading.Thread(target=start_websocket, args=(flask_app,))
        websocket_thread.daemon = True
        websocket_thread.start()

    return flask_app
