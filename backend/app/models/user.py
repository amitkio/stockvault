# models/user.py

from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from .base import Base

class User(Base):
    """
    Represents a user in the 'users' table.
    A user can own multiple portfolios.
    """
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship to Portfolios (One-to-Many)
    # The 'Portfolio' string refers to the class name to avoid circular imports.
    portfolios = relationship(
        "Portfolio",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(user_id={self.user_id}, username='{self.username}')>"