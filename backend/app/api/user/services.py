from app.models import User, Portfolio
from app.extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


def register_user(username, password, email):
    if (
        db.session.query(User)
        .filter((User.username == username) | (User.email == email))
        .first()
    ):
        raise Exception("Username or email already exists.")

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password_hash=hashed_password, email=email)
    db.session.add(new_user)
    db.session.commit()
    portfolio = Portfolio(new_user.user_id, portfolio_name="My Portfolio")
    db.session.add(portfolio)
    db.session.commit()

    return new_user


def verify_user_credentials(username, password):
    user = db.session.query(User).filter_by(username=username).first()
    if user and check_password_hash(user.password_hash, password):
        return user
    return None
