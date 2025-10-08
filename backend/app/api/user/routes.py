from flask import Blueprint, request, jsonify, Response
from http import HTTPStatus
import datetime
from typing import Tuple, Dict, Any

from flask_jwt_extended import create_access_token, jwt_required
from flask_jwt_extended.exceptions import NoAuthorizationError
from app.api.user import services as user_services

import traceback


class ApiError(Exception):
    def __init__(self, message: str, status_code: int = HTTPStatus.BAD_REQUEST):
        super().__init__(message)
        self.status_code = status_code


auth_bp = Blueprint("auth", __name__, url_prefix="/")


@auth_bp.errorhandler(ApiError)
def handle_api_error(error: ApiError) -> Tuple[Response, int]:
    return jsonify({"message": str(error)}), error.status_code


@auth_bp.errorhandler(404)
def handle_not_found(error) -> Tuple[Response, int]:
    return jsonify(
        {"message": "The requested resource was not found"}
    ), HTTPStatus.NOT_FOUND


@auth_bp.errorhandler(NoAuthorizationError)
def handle_no_auth(error: Exception) -> Tuple[Response, int]:
    traceback.print_exc()
    return jsonify(
        {"message": "You must be logged in to access this resource."}
    ), HTTPStatus.FORBIDDEN


@auth_bp.errorhandler(Exception)
def handle_generic_error(error: Exception) -> Tuple[Response, int]:
    traceback.print_exc()
    return jsonify(
        {"message": "An unexpected internal server error occurred"}
    ), HTTPStatus.INTERNAL_SERVER_ERROR


def _user_to_dict(user: Any) -> Dict[str, Any]:
    if not user:
        return {}
    return {
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
    }


@auth_bp.route("/auth/register", methods=["POST"])
def register_user_route() -> Tuple[Response, int]:
    user_data = request.get_json()
    if not user_data:
        raise ApiError("Request body must be JSON.")

    username = user_data.get("username")
    password = user_data.get("password")
    email = user_data.get("email")

    if not all([username, password, email]):
        raise ApiError("Missing required fields: username, password, email.")

    new_user = user_services.register_user(
        username=username, password=password, email=email
    )
    return jsonify(_user_to_dict(new_user)), HTTPStatus.CREATED


@auth_bp.route("/auth/login", methods=["POST"])
def login_user_route() -> Tuple[Response, int]:
    user_data = request.get_json()
    if not user_data:
        raise ApiError("Request body must be JSON.")

    username = user_data.get("username")
    password = user_data.get("password")

    if not username or not password:
        raise ApiError("Username and password are required.")

    user = user_services.verify_user_credentials(username, password)
    if not user:
        raise ApiError("Invalid username or password", HTTPStatus.UNAUTHORIZED)

    access_token = create_access_token(
        identity=str(user.user_id),
        expires_delta=datetime.timedelta(hours=24),
    )

    response_data = {"access_token": access_token, "user": _user_to_dict(user)}
    return jsonify(response_data), HTTPStatus.OK


@auth_bp.route("/auth/test", methods=["GET"])
@jwt_required()
def hello():
    return "Hello World"
