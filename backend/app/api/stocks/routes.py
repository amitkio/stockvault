from flask import Blueprint, jsonify
from app.extensions import socketio
from http import HTTPStatus
from . import services as stock_services
from typing import Tuple

from flask import Response
from flask_jwt_extended import jwt_required
from flask_jwt_extended.exceptions import NoAuthorizationError

stocks_bp = Blueprint("stocks", __name__, url_prefix="/stocks")


@stocks_bp.route("", methods=["GET"])
@jwt_required()
def get_all_stocks_route():
    """
    Get all stocks and their latest OHLC data.
    """
    stocks_data = stock_services.get_all_stocks_with_latest_ohlc()

    if not stocks_data:
        return jsonify({"message": "No stocks found"}), 404

    results = []
    for stock, latest_ohlc in stocks_data:
        stock_details = {
            "stock_id": stock.stock_id,
            "symbol": stock.symbol,
            "company_name": stock.company_name,
            "sector": stock.sector,
        }

        if latest_ohlc:
            stock_details["latest_ohlc"] = {
                "date": latest_ohlc.date.isoformat(),
                "open": latest_ohlc.open,
                "high": latest_ohlc.high,
                "low": latest_ohlc.low,
                "close": latest_ohlc.close,
                "volume": latest_ohlc.volume,
            }
        else:
            stock_details["latest_ohlc"] = None
        results.append(stock_details)

    return jsonify(results)


@stocks_bp.route("/<string:stock_id>/history", methods=["GET"])
@jwt_required()
def get_stock_history(stock_id):
    """
    Get historical data for a stock.
    """
    history = stock_services.get_historical_data(stock_id)
    if not history:
        return jsonify({"message": "No historical data found for this ticker."}), 404
    return jsonify([ts.to_dict() for ts in history])


@socketio.on("connect", namespace="/stocks")
def handle_connect():
    print("Client connected to stocks")
    socketio.emit("status", {"msg": "Connected to stocks feed"}, namespace="/stocks")


@socketio.on("disconnect", namespace="/stocks")
def handle_disconnect():
    print("Client disconnected from stocks")


@socketio.on("subscribe", namespace="/stocks")
def handle_subscribe(data):
    ticker = data.get("ticker")
    if ticker:
        socketio.emit("subscribed", {"ticker": ticker}, namespace="/stocks")


@stocks_bp.errorhandler(NoAuthorizationError)
def handle_no_auth(error: Exception) -> Tuple[Response, int]:
    return jsonify(
        {"message": "You must be logged in to access this resource."}
    ), HTTPStatus.FORBIDDEN
