from __future__ import annotations
from datetime import datetime
from typing import List, TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import String, func, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session

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
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), unique=True)
    portfolio_name: Mapped[str] = mapped_column(String(100), nullable=False)
    # Add a cash balance to the portfolio. Defaulting to 100,000 for new portfolios
    # for demonstration/simulation purposes.
    cash_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 4), nullable=False, default=Decimal("100000.00")
    )

    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), init=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now(), init=False
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="portfolio", init=False)
    holdings: Mapped[List["Holding"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan", init=False
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="portfolio", cascade="all, delete-orphan", init=False
    )

    def __repr__(self):
        return f"<Portfolio(portfolio_id={self.portfolio_id}, name='{self.portfolio_name}')>"
