from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ============================================================
# USER SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================================================
# AI AGENT SCHEMAS
# ============================================================

class AgentBase(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=150
    )

    description: str = Field(
        ...,
        min_length=1
    )

    category: str = Field(
        default="Analytics",
        max_length=50
    )

    status: str = Field(
        default="Idle",
        max_length=30
    )

    health: int = Field(
        default=100,
        ge=0,
        le=100
    )

    tasks: int = Field(
        default=0,
        ge=0
    )

    icon_name: str = Field(
        default="Bot",
        max_length=50
    )

    color: str = Field(
        default="blue",
        max_length=30
    )

    ai_model: str = Field(
        default="GPT-4o",
        max_length=100
    )

    system_instructions: str | None = None

    temperature: float = Field(
        default=0.7,
        ge=0.0,
        le=2.0
    )


# ============================================================
# CREATE AGENT
# ============================================================

class AgentCreate(AgentBase):
    pass


# ============================================================
# UPDATE / CONFIGURE AGENT
# ============================================================

class AgentUpdate(BaseModel):

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    description: str | None = Field(
        default=None,
        min_length=1
    )

    category: str | None = Field(
        default=None,
        max_length=50
    )

    status: str | None = Field(
        default=None,
        max_length=30
    )

    health: int | None = Field(
        default=None,
        ge=0,
        le=100
    )

    tasks: int | None = Field(
        default=None,
        ge=0
    )

    icon_name: str | None = Field(
        default=None,
        max_length=50
    )

    color: str | None = Field(
        default=None,
        max_length=30
    )

    ai_model: str | None = Field(
        default=None,
        max_length=100
    )

    system_instructions: str | None = None

    temperature: float | None = Field(
        default=None,
        ge=0.0,
        le=2.0
    )


# ============================================================
# AGENT RESPONSE
# ============================================================

class AgentResponse(AgentBase):
    id: int

    last_activity: datetime | None = None

    created_at: datetime | None = None

    updated_at: datetime | None = None

    class Config:
        from_attributes = True


# ============================================================
# NOTIFICATION SCHEMAS
# ============================================================


# ------------------------------------------------------------
# CREATE NOTIFICATION
# ------------------------------------------------------------

class NotificationCreate(BaseModel):

    title: str = Field(
        ...,
        min_length=1,
        max_length=200
    )

    message: str = Field(
        ...,
        min_length=1
    )

    type: str = Field(
        default="info",
        max_length=30
    )


# ------------------------------------------------------------
# NOTIFICATION RESPONSE
# ------------------------------------------------------------

class NotificationResponse(BaseModel):

    id: int

    title: str

    message: str

    type: str

    is_read: int

    created_at: datetime | None = None

    class Config:
        from_attributes = True