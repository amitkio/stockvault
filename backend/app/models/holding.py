# models/holding.py

from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from .base import Base

class Holding(Base):
    """
    Represents a stock holding in a portfolio.
    Links a portfolio to a stock with a specific quantity.
    """
    __tablename__ = 'holdings'

    holding_id = Column(Integer, primary_key=True)
    portfolio_id = Column(Integer, ForeignKey('portfolios.portfolio_id'), nullable=False)
    stock_id = Column(Integer, ForeignKey('stocks.stock_id'), nullable=False)
    quantity = Column(Numeric(18, 8), nullable=False, default=0)
    average_cost_per_share = Column(Numeric(18, 4), nullable=False)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    portfolio = relationship("Portfolio", back_populates="holdings")
    stock = relationship("Stock", back_populates="holdings")

    def __repr__(self):
        return f"<Holding(portfolio={self.portfolio_id}, stock={self.stock_id}, quantity={self.quantity})>"