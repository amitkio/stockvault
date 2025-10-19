# backend/app/routes/portfolio_routes.py
from flask import Blueprint, jsonify, request
from http import HTTPStatus
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import Portfolio, Holding, Transaction, TransactionTypeEnum
from decimal import Decimal
from datetime import datetime
from dataclasses import asdict, is_dataclass
from sqlalchemy.exc import IntegrityError
import enum

portfolio_bp = Blueprint("portfolio_bp", __name__, url_prefix="/portfolios")


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
            c.name: sanitize_value(getattr(obj, c.name))
            for c in obj.__table__.columns
        }
    # For non-SQLAlchemy dataclasses.
    if is_dataclass(obj):
        return {k: sanitize_value(v) for k, v in asdict(obj).items()}
    # Fallback for other objects.
    return {k: sanitize_value(v) for k, v in obj.__dict__.items() if not k.startswith("_")}


def get_portfolio_for_user(portfolio_id: int, user_id: int):
    """
    Fetches a portfolio by its ID, ensuring it belongs to the specified user.
    Returns the portfolio object or None if not found.
    """
    return db.session.execute(
        db.select(Portfolio).filter_by(
            portfolio_id=portfolio_id,
            user_id=user_id
        )
    ).scalar_one_or_none()


# GET /portfolios -> list all portfolios for the logged-in user
@portfolio_bp.route("/", methods=["GET"])
@jwt_required()
def list_portfolios():
    user_id = get_jwt_identity()
    portfolios = db.session.execute(
        db.select(Portfolio).filter_by(user_id=user_id)
    ).scalars().all()
    return jsonify([model_to_dict(p) for p in portfolios]), HTTPStatus.OK


# POST /portfolios -> create a new portfolio
@portfolio_bp.route("/", methods=["POST"])
@jwt_required()
def create_portfolio():
    user_id = get_jwt_identity()
    data = request.get_json()

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
            jsonify({"message": "A portfolio with this name already exists."}),
            HTTPStatus.CONFLICT,
        )
    return jsonify(model_to_dict(new_portfolio)), HTTPStatus.CREATED


# GET /portfolios/<id> -> get a single portfolio
@portfolio_bp.route("/<int:portfolio_id>", methods=["GET"])
@jwt_required()
def get_portfolio(portfolio_id: int):
    user_id = get_jwt_identity()
    portfolio = get_portfolio_for_user(portfolio_id, user_id)
    if not portfolio:
        return jsonify({"message": "Portfolio not found"}), HTTPStatus.NOT_FOUND
    return jsonify(model_to_dict(portfolio)), HTTPStatus.OK


# DELETE /portfolios/<id> -> delete a portfolio
@portfolio_bp.route("/<int:portfolio_id>", methods=["DELETE"])
@jwt_required()
def delete_portfolio(portfolio_id: int):
    user_id = get_jwt_identity()
    portfolio = get_portfolio_for_user(portfolio_id, user_id)
    if not portfolio:
        return jsonify({"message": "Portfolio not found"}), HTTPStatus.NOT_FOUND

    db.session.delete(portfolio)
    db.session.commit()
    return "", HTTPStatus.NO_CONTENT


# GET /portfolios/<id>/holdings
@portfolio_bp.route("/<int:portfolio_id>/holdings", methods=["GET"])
@jwt_required()
def get_holdings(portfolio_id: int):
    user_id = get_jwt_identity()
    portfolio = get_portfolio_for_user(portfolio_id, user_id)
    if not portfolio:
        return jsonify({"message": "Portfolio not found"}), HTTPStatus.NOT_FOUND

    holdings = db.session.execute(
        db.select(Holding).filter_by(portfolio_id=portfolio_id)
    ).scalars().all()
    data = [model_to_dict(h) for h in holdings]
    return jsonify(data), HTTPStatus.OK

# GET /portfolios/<id>/transactions
@portfolio_bp.route("/<int:portfolio_id>/transactions", methods=["GET"])
@jwt_required()
def get_transactions(portfolio_id: int):
    user_id = get_jwt_identity()
    portfolio = get_portfolio_for_user(portfolio_id, user_id)
    if not portfolio:
        return jsonify({"message": "Portfolio not found"}), HTTPStatus.NOT_FOUND

    txs = db.session.execute(
        db.select(Transaction).filter_by(portfolio_id=portfolio_id)
    ).scalars().all()
    data = [model_to_dict(t) for t in txs]
    return jsonify(data), HTTPStatus.OK
