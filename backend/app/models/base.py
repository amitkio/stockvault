# models/base.py

from sqlalchemy.orm import DeclarativeBase

# Define a shared Base class for all declarative models
class Base(DeclarativeBase):
    """Base class for all database models."""
    pass