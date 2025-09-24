# models/transaction.py

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Numeric, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base

class TransactionTypeEnum(enum.Enum):
    """Enum for the type of transaction."""
    BUY = "BUY"
    SELL = "SELL"

class Transaction(Base):
    """
    Represents a transaction in the 'transactions' table.
    """
    __tablename__ = 'transactions'

    transaction_id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey('portfolios.portfolio_id'), nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.stock_id'), nullable=False)
    transaction_type = Column(Enum(TransactionTypeEnum, name="transaction_type_enum"), nullable=False)
    quantity = Column(Numeric(18, 8), nullable=False)
    price_per_share = Column(Numeric(18, 4), nullable=False)
    transaction_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    portfolio = relationship("Portfolio", back_populates="transactions")
    stock = relationship("Stock", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.transaction_id}, type='{self.transaction_type.name}')>"