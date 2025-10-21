from app import create_app

# This creates the Flask app instance.
# The `create_app` function will automatically load configuration
# from the Config class, which in turn loads from your .env file.
app = create_app()
