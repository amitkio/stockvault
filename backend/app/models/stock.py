from __future__ import annotations
from typing import List, TYPE_CHECKING
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models import Holding, Transaction


class Stock(Base):
    """
    Represents a stock in the 'stocks' table.
    """

    __tablename__ = "stocks"

    stock_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, init=False
    )
    symbol: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str] = mapped_column(String(100), nullable=True)

    # Relationships
    holdings: Mapped[List["Holding"]] = relationship(
        back_populates="stock", init=False, default_factory=list
    )
    transactions: Mapped[List["Transaction"]] = relationship(
        back_populates="stock", init=False, default_factory=list
    )

    def __repr__(self):
        return f"<Stock(stock_id={self.stock_id}, symbol='{self.symbol}')>"
