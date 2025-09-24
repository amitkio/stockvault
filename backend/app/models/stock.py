# models/stock.py

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from .base import Base

class Stock(Base):
    """
    Represents a stock in the 'stocks' table.
    """
    __tablename__ = 'stocks'

    stock_id = Column(Integer, primary_key=True)
    symbol = Column(String(10), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=True)

    # Relationships
    holdings = relationship("Holding", back_populates="stock")
    transactions = relationship("Transaction", back_populates="stock")

    def __repr__(self):
        return f"<Stock(stock_id={self.stock_id}, symbol='{self.symbol}')>"