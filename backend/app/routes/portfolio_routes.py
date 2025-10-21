# backend/app/routes/portfolio_routes.py
from flask import Blueprint, jsonify, request
from http import HTTPStatus
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Portfolio, Holding, Transaction, TransactionTypeEnum, Stock
from decimal import Decimal
from app.services.portfolio_service import execute_transaction, PortfolioServiceError
from datetime import datetime
from dataclasses import asdict, is_dataclass
from functools import wraps
from sqlalchemy.exc import IntegrityError
import enum

import traceback


portfolio_bp_single = Blueprint(
    "portfolio_bp_single", __name__, url_prefix="/portfolio"
)


def sanitize_value(v):
    """Helper to sanitize values for JSON serialization."""
    if isinstance(v, enum.Enum):
        return v.value
    if isinstance(v, Decimal):
        return float(v)
    if isinstance(v, datetime):
        return v.isoformat()
    return v


def model_to_dict(obj):
    """
    Generic helper to convert a SQLAlchemy model instance to a dictionary.
    Handles both legacy and dataclass-mapped models.
    """
    # For SQLAlchemy models, only serialize columns to avoid circular recursion.
    # This works for both traditional and dataclass-based models.
    if hasattr(obj, "__table__"):
        return {
            c.name: sanitize_value(getattr(obj, c.name)) for c in obj.__table__.columns
        }
    # For non-SQLAlchemy dataclasses.
    if is_dataclass(obj):
        return {k: sanitize_value(v) for k, v in asdict(obj).items()}  # type: ignore
    # Fallback for other objects.
    return {
        k: sanitize_value(v) for k, v in obj.__dict__.items() if not k.startswith("_")
    }


def portfolio_required(f):
    """A decorator to fetch the user's portfolio and pass it to the route."""

    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        user_id = get_jwt_identity()
        portfolio = db.session.execute(
            db.select(Portfolio).filter_by(user_id=user_id)
        ).scalar_one_or_none()
        if not portfolio:
            return jsonify({"message": "Portfolio not found"}), HTTPStatus.NOT_FOUND
        return f(portfolio, *args, **kwargs)

    return decorated_function


# GET /portfolio -> get the portfolio for the logged-in user
@portfolio_bp_single.route("/", methods=["GET"])
@portfolio_required
def get_portfolio(portfolio: Portfolio):
    """Gets the current user's portfolio."""
    return jsonify(model_to_dict(portfolio)), HTTPStatus.OK


# POST /portfolio -> create a new portfolio for the logged-in user
@portfolio_bp_single.route("/", methods=["POST"])
@jwt_required()
def create_portfolio():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True)

    # Check if user already has a portfolio
    existing_portfolio = db.session.execute(
        db.select(Portfolio).filter_by(user_id=user_id)
    ).scalar_one_or_none()
    if existing_portfolio:
        return jsonify(
            {"message": "User already has a portfolio."}
        ), HTTPStatus.CONFLICT

    if not data:
        return (
            jsonify({"message": "Invalid JSON or missing request body."}),
            HTTPStatus.BAD_REQUEST,
        )

    name = data.get("portfolio_name") if data else None
    if not name:
        return (
            jsonify({"message": "portfolio_name is required"}),
            HTTPStatus.BAD_REQUEST,
        )

    new_portfolio = Portfolio(user_id=user_id, portfolio_name=name)
    db.session.add(new_portfolio)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return (
            jsonify({"message": "Error creating portfolio. It may already exist."}),
            HTTPStatus.CONFLICT,
        )
    return jsonify(model_to_dict(new_portfolio)), HTTPStatus.CREATED


# DELETE /portfolio -> delete a portfolio
@portfolio_bp_single.route("/", methods=["DELETE"])
@portfolio_required
def delete_portfolio(portfolio: Portfolio):
    """Deletes the current user's portfolio."""
    db.session.delete(portfolio)
    db.session.commit()
    return "", HTTPStatus.NO_CONTENT


# GET /portfolio/holdings
@portfolio_bp_single.route("/holdings", methods=["GET"])
@portfolio_required
def get_holdings(portfolio: Portfolio):
    """Gets all holdings for the current user's portfolio."""
    holdings = (
        db.session.execute(
            db.select(Holding).filter_by(portfolio_id=portfolio.portfolio_id)
        )
        .scalars()
        .all()
    )
    data = [model_to_dict(h) for h in holdings]
    return jsonify(data), HTTPStatus.OK


# GET /portfolio/transactions
@portfolio_bp_single.route("/transactions", methods=["GET"])
@portfolio_required
def get_transactions(portfolio: Portfolio):
    """Gets all transactions for the current user's portfolio."""
    txs = (
        db.session.execute(
            db.select(Transaction).filter_by(portfolio_id=portfolio.portfolio_id)
        )
        .scalars()
        .all()
    )
    data = [model_to_dict(t) for t in txs]
    for tx in data:
        tx["symbol"] = (
            db.session.execute(
                db.select(Stock.symbol).filter_by(stock_id=tx["stock_id"])
            )
            .one()
            .symbol[:-3]
        )
    return jsonify(data), HTTPStatus.OK


# POST /portfolio/transactions -> execute a buy or sell transaction
@portfolio_bp_single.route("/transactions", methods=["POST"])
@portfolio_required
def post_transaction(portfolio: Portfolio):
    """Executes a buy or sell transaction for the current user."""
    data = request.get_json()

    # --- Input Validation ---
    symbol = data.get("symbol")
    quantity_str = data.get("quantity")
    tx_type_str = data.get("transaction_type", "").upper()

    if not all([symbol, quantity_str, tx_type_str]):
        return jsonify(
            {"message": "Missing required fields: symbol, quantity, transaction_type"}
        ), HTTPStatus.BAD_REQUEST

    try:
        quantity = Decimal(quantity_str)
        if quantity <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify(
            {"message": "Invalid quantity provided."}
        ), HTTPStatus.BAD_REQUEST

    try:
        tx_type = TransactionTypeEnum[tx_type_str]
    except KeyError:
        return jsonify(
            {"message": "Invalid transaction_type. Must be 'BUY' or 'SELL'."}
        ), HTTPStatus.BAD_REQUEST

    # --- Database Operations ---
    stock = db.session.execute(
        db.select(Stock).filter_by(symbol=symbol)
    ).scalar_one_or_none()
    if not stock:
        return jsonify(
            {"message": f"Stock with symbol '{symbol}' not found."}
        ), HTTPStatus.NOT_FOUND

    try:
        # Use the service to execute the transaction
        transaction = execute_transaction(
            db.session,  # type: ignore
            portfolio,
            stock,
            quantity,
            tx_type,
        )
        db.session.commit()
        return jsonify(model_to_dict(transaction)), HTTPStatus.CREATED
    except PortfolioServiceError as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), HTTPStatus.BAD_REQUEST
    except Exception:
        db.session.rollback()
        # Log the full exception here in a real application
        traceback.print_exc()
        return jsonify(
            {"message": "An unexpected error occurred."}
        ), HTTPStatus.INTERNAL_SERVER_ERROR
