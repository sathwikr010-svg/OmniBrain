from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import Agent


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/")
def dashboard(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # ============================================================
    # TOTAL AGENTS
    # ============================================================

    total_agents = (
        db.query(Agent).count()
    )

    # ============================================================
    # ACTIVE / RUNNING AGENTS
    # ============================================================

    active_agents = (
        db.query(Agent)
        .filter(
            func.lower(Agent.status).in_(
                ["active", "running"]
            )
        )
        .count()
    )

    # ============================================================
    # IDLE AGENTS
    # ============================================================

    idle_agents = (
        db.query(Agent)
        .filter(
            func.lower(Agent.status) == "idle"
        )
        .count()
    )

    # ============================================================
    # ERROR AGENTS
    # ============================================================

    error_agents = (
        db.query(Agent)
        .filter(
            func.lower(Agent.status).in_(
                ["error", "failed", "offline"]
            )
        )
        .count()
    )

    # ============================================================
    # AVERAGE AGENT HEALTH
    # ============================================================

    average_health = (
        db.query(
            func.avg(Agent.health)
        )
        .scalar()
    )

    if average_health is None:
        average_health = 0
    else:
        average_health = round(
            float(average_health),
            1,
        )

    # ============================================================
    # TOTAL TASKS
    # ============================================================

    total_tasks = (
        db.query(
            func.coalesce(
                func.sum(Agent.tasks),
                0,
            )
        )
        .scalar()
    )

    # ============================================================
    # RETURN DASHBOARD DATA
    # ============================================================

    return {
        "user": {
            "username": user.username,
            "email": user.email,
        },

        "status": "Online",

        "statistics": {
            "total_agents": total_agents,
            "active_agents": active_agents,
            "idle_agents": idle_agents,
            "error_agents": error_agents,
            "average_health": average_health,
            "total_tasks": int(
                total_tasks or 0
            ),
        },
    }