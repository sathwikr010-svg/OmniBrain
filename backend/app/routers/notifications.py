from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.auth import get_current_user
from backend.app.database import get_db
from backend.app.models import Agent


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get("/")
def get_notifications(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = []

    agents = (
        db.query(Agent)
        .order_by(Agent.id.asc())
        .all()
    )

    # --------------------------------------------------------
    # AGENT STATUS
    # --------------------------------------------------------

    error_agents = [
        agent
        for agent in agents
        if (agent.status or "").strip().lower()
        in {"error", "failed", "offline"}
    ]

    active_agents = [
        agent
        for agent in agents
        if (agent.status or "").strip().lower()
        in {"active", "running"}
    ]

    idle_agents = [
        agent
        for agent in agents
        if (agent.status or "").strip().lower()
        == "idle"
    ]

    # --------------------------------------------------------
    # SYSTEM STATUS
    # --------------------------------------------------------

    if error_agents:

        notifications.append({
            "id": "system-error",
            "title": "Agent Attention Required",
            "text": (
                f"{len(error_agents)} agent"
                f"{'s are' if len(error_agents) != 1 else ' is'} "
                "reporting an error or offline status."
            ),
            "type": "warning",
            "read": False,
            "created_at": datetime.now().isoformat(),
        })

    else:

        notifications.append({
            "id": "system-online",
            "title": "AI System Online",
            "text": "All monitored AI services are operational.",
            "type": "success",
            "read": False,
            "created_at": datetime.now().isoformat(),
        })

    # --------------------------------------------------------
    # AGENT MONITORING
    # --------------------------------------------------------

    if agents:

        notifications.append({
            "id": "agent-monitoring",
            "title": "Agent Monitoring",
            "text": (
                f"{len(agents)} AI agent"
                f"{'s are' if len(agents) != 1 else ' is'} "
                f"being monitored. "
                f"{len(active_agents)} currently active."
            ),
            "type": "info",
            "read": False,
            "created_at": datetime.now().isoformat(),
        })

    # --------------------------------------------------------
    # IDLE AGENTS
    # --------------------------------------------------------

    if idle_agents:

        notifications.append({
            "id": "idle-agents",
            "title": "Idle Agents",
            "text": (
                f"{len(idle_agents)} agent"
                f"{'s are' if len(idle_agents) != 1 else ' is'} "
                "currently idle."
            ),
            "type": "warning",
            "read": False,
            "created_at": datetime.now().isoformat(),
        })

    # --------------------------------------------------------
    # SYSTEM HEALTH
    # --------------------------------------------------------

    if agents:

        total_health = sum(
            int(agent.health or 0)
            for agent in agents
        )

        average_health = (
            total_health / len(agents)
        )

        if average_health >= 80:

            notifications.append({
                "id": "health-check",
                "title": "System Health Check",
                "text": (
                    f"Latest system health is "
                    f"{round(average_health)}%. "
                    "No critical health issues detected."
                ),
                "type": "success",
                "read": False,
                "created_at": datetime.now().isoformat(),
            })

        else:

            notifications.append({
                "id": "health-warning",
                "title": "System Health Warning",
                "text": (
                    f"System health has dropped to "
                    f"{round(average_health)}%. "
                    "Some components may require attention."
                ),
                "type": "warning",
                "read": False,
                "created_at": datetime.now().isoformat(),
            })

    return {
        "notifications": notifications,
        "total": len(notifications),
        "unread": len(notifications),
    }


# ============================================================
# UNREAD COUNT
# ============================================================

@router.get("/unread-count")
def get_unread_count(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    agents = (
        db.query(Agent)
        .all()
    )

    error_count = sum(
        1
        for agent in agents
        if (agent.status or "").strip().lower()
        in {"error", "failed", "offline"}
    )

    return {
        "unread": error_count
    }


# ============================================================
# MARK AS READ
# ============================================================

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    user=Depends(get_current_user),
):
    return {
        "message": "Notification marked as read.",
        "notification_id": notification_id,
        "read": True,
    }


# ============================================================
# MARK ALL AS READ
# ============================================================

@router.patch("/read-all")
def mark_all_notifications_read(
    user=Depends(get_current_user),
):
    return {
        "message": "All notifications marked as read.",
        "read": True,
    }