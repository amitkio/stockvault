from __future__ import annotations
from typing import TYPE_CHECKING
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Numeric, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models import Portfolio, Stock


class Holding(Base):
    """
    Represents a stock holding in a portfolio.
    Links a portfolio to a stock with a specific quantity.
    """

    __tablename__ = "holdings"

    holding_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, init=False
    )
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.portfolio_id"))
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.stock_id"))
    # Relationships
    portfolio: Mapped["Portfolio"] = relationship(back_populates="holdings")
    stock: Mapped["Stock"] = relationship(back_populates="holdings")

    average_cost_per_share: Mapped[Decimal] = mapped_column(
        Numeric(18, 4), nullable=False
    )
    last_updated: Mapped[datetime] = mapped_column(
        server_default=func.now(), onupdate=func.now()
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False, default=0)

    def __repr__(self):
        return f"<Holding(portfolio={self.portfolio_id}, stock={self.stock_id}, quantity={self.quantity})>"
