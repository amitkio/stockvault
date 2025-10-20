import yfinance as yf
from app.extensions import db, socketio
from app.models import Stock, TimeSeries

import pandas as pd


TOP_50_STOCKS = [
    "ADANIENT.NS",
    "ADANIPORTS.NS",
    "APOLLOHOSP.NS",
    "ASIANPAINT.NS",
    "AXISBANK.NS",
    "BAJAJ-AUTO.NS",
    "BAJFINANCE.NS",
    "BAJAJFINSV.NS",
    "BPCL.NS",
    "BHARTIARTL.NS",
    "BRITANNIA.NS",
    "CIPLA.NS",
    "COALINDIA.NS",
    "DIVISLAB.NS",
    "DRREDDY.NS",
    "EICHERMOT.NS",
    "GRASIM.NS",
    "HCLTECH.NS",
    "HDFCBANK.NS",
    "HDFCLIFE.NS",
    "HEROMOTOCO.NS",
    "HINDALCO.NS",
    "HINDUNILVR.NS",
    "ICICIBANK.NS",
    "ITC.NS",
    "INDUSINDBK.NS",
    "INFY.NS",
    "JSWSTEEL.NS",
    "KOTAKBANK.NS",
    "LTIM.NS",
    "LT.NS",
    "M&M.NS",
    "MARUTI.NS",
    "NTPC.NS",
    "NESTLEIND.NS",
    "ONGC.NS",
    "POWERGRID.NS",
    "RELIANCE.NS",
    "SBILIFE.NS",
    "SBIN.NS",
    "SUNPHARMA.NS",
    "TATAMOTORS.NS",
    "TATACONSUM.NS",
    "TATASTEEL.NS",
    "TCS.NS",
    "TECHM.NS",
    "TITAN.NS",
    "ULTRACEMCO.NS",
    "UPL.NS",
    "WIPRO.NS",
]


def fetch_and_update_stock_data():
    """
    Fetches historical data for the top 50 US stocks and updates the database.
    """

    if db.session.query(TimeSeries).first() is not None:
        return
    try:
        tickers = yf.Tickers(TOP_50_STOCKS)
        for symbol in TOP_50_STOCKS:
            try:
                stock_data = tickers.tickers[symbol]
                info = stock_data.info
                hist = stock_data.history(period="1mo")

                stock = db.session.scalar(db.select(Stock).filter_by(symbol=symbol))
                if not stock:
                    stock = Stock(
                        symbol=symbol,
                        company_name=info.get("longName", ""),
                        sector=info.get("sector", ""),
                    )
                    db.session.add(stock)
                    db.session.commit()
                for date, *row in hist.itertuples():
                    time_series_entry = TimeSeries(
                        stock_id=stock.stock_id,
                        date=pd.to_datetime(date),
                        open=row[0],
                        high=row[1],
                        low=row[2],
                        close=row[3],
                        volume=row[4],
                    )
                    db.session.add(time_series_entry)
                db.session.commit()
                print(f"Successfully updated data for {symbol}")
            except Exception as e:
                print(f"Failed to fetch data for {symbol}: {e}")
    except Exception as e:
        print(f"Failed to fetch data for tickers: {e}")


def start_websocket(app):
    """
    Starts the WebSocket client to listen for real-time stock updates.
    """
    ws = yf.WebSocket()

    def message_handler(msg):
        with app.app_context():
            try:
                symbol = msg.get("id")
                price = msg.get("price")
                if not symbol or not price:
                    return

                stock = db.session.scalar(db.select(Stock).filter_by(symbol=symbol))
                if not stock:
                    return

                today = pd.to_datetime("today").date()
                todays_ts = db.session.scalar(
                    db.select(TimeSeries).filter_by(stock_id=stock.stock_id, date=today)
                )

                if todays_ts:
                    if todays_ts.close != price:
                        todays_ts.close = price
                        todays_ts.high = max(todays_ts.high, price)
                        todays_ts.low = min(todays_ts.low, price)
                        db.session.commit()
                        socketio.emit(
                            "price_update",
                            {"symbol": symbol, "price": price},
                            namespace="/stocks",
                        )
                else:
                    print(f"First price update for {symbol} today: {price}")
                    new_ts = TimeSeries(
                        stock_id=stock.stock_id,
                        date=today,  # type: ignore
                        open=price,
                        high=price,
                        low=price,
                        close=price,
                        volume=msg.get("day_volume", 0),
                    )
                    db.session.add(new_ts)
                    db.session.commit()
            except Exception as e:
                print(f"Error processing message: {e}")

    ws.subscribe(TOP_50_STOCKS)
    ws.listen(message_handler)
