from __future__ import annotations
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models import Portfolio


class User(Base):
    """
    Represents a user in the 'users' table.
    A user can own multiple portfolios.
    """

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, init=False
    )
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)

    portfolios: Mapped[List["Portfolio"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", init=False, default_factory=list
    )

    def __repr__(self):
        return f"<User(user_id={self.user_id}, username='{self.username}')>"
