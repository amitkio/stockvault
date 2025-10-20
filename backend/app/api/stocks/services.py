from app.extensions import db
from app.models import TimeSeries, Stock
from sqlalchemy import desc


def get_historical_data(stock_id):
    """
    Get historical data for a given stock ticker.
    """
    return (
        db.session.query(TimeSeries)
        .filter_by(stock_id=stock_id)
        .order_by(TimeSeries.date.asc())
        .all()
    )


def get_all_stocks_with_latest_ohlc():
    """
    Get all stocks and their latest OHLC data.
    """
    stocks = db.session.query(Stock).all()
    if not stocks:
        return []

    results = []
    for stock in stocks:
        latest_timeseries = (
            db.session.query(TimeSeries)
            .filter_by(stock_id=stock.stock_id)
            .order_by(desc(TimeSeries.date))
            .first()
        )
        results.append((stock, latest_timeseries))

    return results
