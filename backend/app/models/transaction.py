from __future__ import annotations
from typing import TYPE_CHECKING
from datetime import datetime
from decimal import Decimal
import enum

from sqlalchemy import Numeric, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.extensions import Base

if TYPE_CHECKING:
    from app.models import Portfolio, Stock


class TransactionTypeEnum(enum.Enum):
    """Enum for the type of transaction."""

    BUY = "BUY"
    SELL = "SELL"


class Transaction(Base):
    """
    Represents a transaction in the 'transactions' table.
    """

    __tablename__ = "transactions"

    transaction_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True, init=False
    )
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.portfolio_id"))
    stock_id: Mapped[int] = mapped_column(ForeignKey("stocks.stock_id"))
    transaction_type: Mapped[TransactionTypeEnum] = mapped_column(
        Enum(TransactionTypeEnum, name="transaction_type_enum"), nullable=False
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 8), nullable=False)
    price_per_share: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship(back_populates="transactions")
    stock: Mapped["Stock"] = relationship(back_populates="transactions")

    transaction_date: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )

    def __repr__(self):
        return f"<Transaction(id={self.transaction_id}, type='{self.transaction_type.name}')>"
