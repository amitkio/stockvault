import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.sqlite3"
    SECRET_KEY = "13h4oua2ron-9u"
    """Application configuration from environment variables."""

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    SECRET_KEY = os.environ.get("SECRET_KEY", "a-default-secret-key-for-dev")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
