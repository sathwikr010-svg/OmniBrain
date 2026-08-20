from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session


from backend.app.database import (
    engine,
    create_tables,
    get_db,
)

from backend.app import models

from backend.app.auth import (
    register_user,
    login_user,
    get_current_user,
)

from backend.app.schemas import (
    UserCreate,
    UserLogin,
)
from backend.app.routers.agents import router as agents_router

from backend.app.routers.dashboard import (
    router as dashboard_router,
)

from backend.app.routers.chat import (
    router as chat_router,
)

from backend.app.routers.knowledge import (
    router as knowledge_router,
)

from backend.app.routers.notifications import (
    router as notifications_router,
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="OmniBrain",
    version="1.0.0",
    description="Industrial Multi-Agent AI Platform",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# ============================================================
# EXISTING ROUTERS
# ============================================================

app.include_router(dashboard_router)

app.include_router(chat_router)

app.include_router(agents_router)

app.include_router(knowledge_router)

app.include_router(notifications_router)


# ============================================================
# DATABASE STARTUP
# ============================================================

@app.on_event("startup")
def test_database():

    create_tables()

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        print(
            "✅ Connected to PostgreSQL successfully!"
        )

    except Exception as e:

        print(
            f"❌ Database connection failed: {e}"
        )


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to OmniBrain",
        "status": "Running",
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "Healthy",
    }


# ============================================================
# REGISTER
# ============================================================

@app.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db),
):

    new_user = register_user(
        db,
        user.username,
        user.email,
        user.password,
    )

    return {
        "message": "User registered successfully",
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
    }


# ============================================================
# LOGIN
# ============================================================

@app.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):

    token = login_user(
        db,
        user.email,
        user.password,
    )

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
    }


# ============================================================
# CURRENT USER
# ============================================================

@app.get("/me")
def get_me(
    current_user=Depends(get_current_user),
):

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
    }