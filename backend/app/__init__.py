from flask import Flask
from app.extensions import db, jwt, migrate, socketio
from app.models import User
from flask_cors import CORS
from app.config import Config


def create_app(config_object=Config) -> Flask:
    flask_app = Flask(__name__)
    flask_app.config.from_object(config_object)

    jwt.init_app(flask_app)
    db.init_app(flask_app)
    migrate.init_app(flask_app, db)
    socketio.init_app(flask_app)

    # Initialize CORS and allow all origins for development
    CORS(flask_app)

    from app.api.user.routes import auth_bp

    flask_app.register_blueprint(auth_bp)

    from app.api.stocks.routes import stocks_bp

    flask_app.register_blueprint(stocks_bp)

    from app.routes.portfolio_routes import portfolio_bp_single

    flask_app.register_blueprint(portfolio_bp_single)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity: str = jwt_data["sub"]
        return db.session.scalar(db.select(User).filter_by(user_id=identity))

    # Register a CLI command to initialize the database and start tasks
    from app.tasks.data_fetch import start_websocket
    import threading

    with flask_app.app_context():
        from app.tasks.data_fetch import fetch_and_update_stock_data, start_websocket
        import threading

        db.create_all()
        fetch_and_update_stock_data()
        websocket_thread = threading.Thread(target=start_websocket, args=(flask_app,))
        websocket_thread.daemon = True
        websocket_thread.start()

    @flask_app.cli.command("init-app")
    def init_app_command():
        """Initializes the database and starts background tasks."""
        from app.tasks.data_fetch import fetch_and_update_stock_data

        print("Creating database tables...")
        db.create_all()
        print("Fetching initial stock data...")
        fetch_and_update_stock_data()
        print("Initialization complete.")

    return flask_app
