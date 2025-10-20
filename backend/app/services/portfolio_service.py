from decimal import Decimal
from sqlalchemy.orm import Session
from ..models import (
    Portfolio,
    Stock,
    Holding,
    Transaction,
    TransactionTypeEnum,
    TimeSeries,
)
from ..extensions import db

class PortfolioServiceError(Exception):
    """Custom exception for portfolio service errors."""

    pass


def get_latest_stock_price(db_session: Session, stock_id: int) -> Decimal:
    """Fetches the most recent closing price for a stock."""
    latest_price_entry = (
        db_session.execute(
            db.select(TimeSeries.close)
            .filter(TimeSeries.stock_id == stock_id)
            .order_by(TimeSeries.date.desc())
        ).scalar_one_or_none()
    )
    if not latest_price_entry:
        raise PortfolioServiceError("No price data available for this stock.")
    return Decimal(str(latest_price_entry.close))


def execute_transaction(
    db_session: Session,
    portfolio: Portfolio,
    stock: Stock,
    quantity: Decimal,
    transaction_type: TransactionTypeEnum,
):
    """
    Executes a buy or sell transaction, ensuring atomicity.
    """
    price_per_share = get_latest_stock_price(db_session, stock.stock_id)
    total_cost = quantity * price_per_share

    holding = db_session.execute(
        db.select(Holding).filter_by(
            portfolio_id=portfolio.portfolio_id, stock_id=stock.stock_id
        )
    ).scalar_one_or_none()

    if transaction_type == TransactionTypeEnum.BUY:
        if portfolio.cash_balance < total_cost:
            raise PortfolioServiceError("Insufficient balance.")

        portfolio.cash_balance -= total_cost

        if not holding:
            # Create a new holding
            holding = Holding(
                portfolio_id=portfolio.portfolio_id,
                stock_id=stock.stock_id,
                quantity=quantity,
                average_cost_per_share=price_per_share,
            )
            db_session.add(holding)
        else:
            # Update existing holding
            old_total_value = holding.quantity * holding.average_cost_per_share
            new_quantity = holding.quantity + quantity
            holding.average_cost_per_share = (old_total_value + total_cost) / new_quantity
            holding.quantity = new_quantity

    elif transaction_type == TransactionTypeEnum.SELL:
        if not holding or holding.quantity < quantity:
            raise PortfolioServiceError("Insufficient holdings to sell.")

        portfolio.cash_balance += total_cost
        holding.quantity -= quantity

        # If all shares are sold, remove the holding
        if holding.quantity == 0:
            db_session.delete(holding)

    # Record the transaction
    new_transaction = Transaction(
        portfolio_id=portfolio.portfolio_id,
        stock_id=stock.stock_id,
        transaction_type=transaction_type,
        quantity=quantity,
        price_per_share=price_per_share,
    )
    db_session.add(new_transaction)

    # The caller is responsible for committing the session
    return new_transaction