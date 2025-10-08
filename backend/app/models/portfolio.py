from __future__ import annotations
from datetime import datetime
from typing import List, TYPE_CHECKING

from sqlalchemy import String, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models import User, Holding, Transaction


class Portfolio(Base):
    """
    Represents a portfolio in the 'portfolios' table.
    Each portfolio belongs to one user.
    """

    __tablename__ = "portfolios"

    portfolio_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, init=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"))
    portfolio_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="portfolios")
    holdings: Mapped[List["Holding"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Portfolio(portfolio_id={self.portfolio_id}, name='{self.portfolio_name}')>"
