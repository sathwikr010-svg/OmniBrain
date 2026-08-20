from sqlalchemy import Column, Integer, String, DateTime, Text, Float
from sqlalchemy.sql import func

from backend.app.database import Base


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        unique=True,
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ============================================================
# AI AGENT MODEL
# ============================================================

class Agent(Base):
    __tablename__ = "agents"

    # --------------------------------------------------------
    # BASIC INFORMATION
    # --------------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    category = Column(
        String(50),
        nullable=False,
        default="Analytics"
    )

    # --------------------------------------------------------
    # AGENT STATUS
    # --------------------------------------------------------

    status = Column(
        String(30),
        nullable=False,
        default="Idle"
    )

    health = Column(
        Integer,
        nullable=False,
        default=100
    )

    tasks = Column(
        Integer,
        nullable=False,
        default=0
    )

    last_activity = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    # --------------------------------------------------------
    # AGENT APPEARANCE
    # --------------------------------------------------------

    icon_name = Column(
        String(50),
        nullable=False,
        default="Bot"
    )

    color = Column(
        String(30),
        nullable=False,
        default="blue"
    )

    # --------------------------------------------------------
    # AI CONFIGURATION
    # --------------------------------------------------------

    ai_model = Column(
        String(100),
        nullable=False,
        default="GPT-4o"
    )

    system_instructions = Column(
        Text,
        nullable=True
    )

    temperature = Column(
        Float,
        nullable=False,
        default=0.7
    )

    # --------------------------------------------------------
    # TIMESTAMPS
    # --------------------------------------------------------

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


# ============================================================
# NOTIFICATION MODEL
# ============================================================

class Notification(Base):
    __tablename__ = "notifications"

    # --------------------------------------------------------
    # BASIC INFORMATION
    # --------------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    # --------------------------------------------------------
    # NOTIFICATION TYPE
    # --------------------------------------------------------
    # Examples:
    # info
    # success
    # warning
    # error

    type = Column(
        String(30),
        nullable=False,
        default="info"
    )

    # --------------------------------------------------------
    # READ STATUS
    # --------------------------------------------------------
    # 0 = unread
    # 1 = read
    #
    # Integer is used here to work reliably with PostgreSQL
    # and the existing SQLAlchemy setup.

    is_read = Column(
        Integer,
        nullable=False,
        default=0
    )

    # --------------------------------------------------------
    # TIMESTAMP
    # --------------------------------------------------------

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )