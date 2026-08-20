from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from backend.app.models import User
from backend.app.database import get_db
from backend.app.security import hash_password
from backend.app.security import verify_password
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
SECRET_KEY = "omniBrain-super-secret-key-change-this"
ALGORITHM = "HS256"

def register_user(db: Session, username: str, email: str, password: str):
    try:
        user = User(
            username=username,
            email=email,
            password=hash_password(password)
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    except Exception as e:
        db.rollback()
        print("ERROR:", repr(e))
        raise
def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(password, user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = jwt.encode(
        {
            "sub": str(user.id),
            "email": user.email
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return token
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user = db.query(User).filter(User.id == int(user_id)).first()

        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found"
            )

        return user

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )    

       