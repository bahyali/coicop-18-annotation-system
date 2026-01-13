from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func, and_
from datetime import datetime, timedelta
from typing import Dict, List
from models import Item, Decision, User
from database import get_session

router = APIRouter()

@router.get("/dashboard/stats")
async def get_dashboard_stats(session: Session = Depends(get_session)):
    """Get comprehensive dashboard statistics"""

    # Total items
    total_items = session.exec(select(func.count(Item.id))).one()

    # Items by status
    completed = session.exec(select(func.count(Item.id)).where(Item.status == "completed")).one()
    pending = session.exec(select(func.count(Item.id)).where(Item.status == "pending")).one()
    escalated = session.exec(select(func.count(Item.id)).where(Item.status == "escalated")).one()

    # Total decisions
    total_decisions = session.exec(select(func.count(Decision.id))).one()

    # Agreement rate (accept actions vs total)
    accept_count = session.exec(
        select(func.count(Decision.id)).where(Decision.action == "accept")
    ).one()
    agreement_rate = (accept_count / total_decisions * 100) if total_decisions > 0 else 0

    # Average time spent
    avg_time_result = session.exec(
        select(func.avg(Decision.time_spent_ms))
    ).one()
    avg_time_seconds = (avg_time_result / 1000) if avg_time_result else 0

    # Time range of system usage
    first_decision = session.exec(
        select(Decision.timestamp).order_by(Decision.timestamp).limit(1)
    ).first()

    if first_decision:
        time_diff = datetime.utcnow() - first_decision
        days_active = time_diff.days
        hours_active = time_diff.total_seconds() / 3600
    else:
        days_active = 0
        hours_active = 0

    # Estimate completion time
    if completed > 0 and days_active > 0:
        rate_per_day = completed / days_active
        remaining = pending + escalated
        estimated_days = remaining / rate_per_day if rate_per_day > 0 else 0
    else:
        estimated_days = 0

    return {
        "total_items": total_items,
        "completed": completed,
        "pending": pending,
        "escalated": escalated,
        "remaining": pending + escalated,
        "completion_percentage": (completed / total_items * 100) if total_items > 0 else 0,
        "total_decisions": total_decisions,
        "agreement_rate": round(agreement_rate, 2),
        "avg_time_seconds": round(avg_time_seconds, 2),
        "days_active": days_active,
        "hours_active": round(hours_active, 2),
        "estimated_days_to_complete": round(estimated_days, 1)
    }

@router.get("/dashboard/user-stats")
async def get_user_stats(session: Session = Depends(get_session)):
    """Get per-user statistics"""

    # Today's date
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    # Get all reviewers with their stats
    reviewers = session.exec(
        select(Decision.reviewer_id,
               func.count(Decision.id).label('total_count'),
               func.sum(Decision.time_spent_ms).label('total_time'))
        .group_by(Decision.reviewer_id)
    ).all()

    user_stats = []
    for reviewer_id, total_count, total_time in reviewers:
        # Today's count
        today_count = session.exec(
            select(func.count(Decision.id))
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.timestamp >= today_start
            ))
        ).one()

        # Agreement rate for this user
        user_accepts = session.exec(
            select(func.count(Decision.id))
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.action == "accept"
            ))
        ).one()

        agreement_rate = (user_accepts / total_count * 100) if total_count > 0 else 0

        # Average time
        avg_time = (total_time / total_count / 1000) if total_count and total_time else 0

        user_stats.append({
            "reviewer_id": reviewer_id,
            "today_count": today_count,
            "total_count": total_count,
            "agreement_rate": round(agreement_rate, 2),
            "avg_time_seconds": round(avg_time, 2)
        })

    # Sort by total count (leaderboard)
    user_stats.sort(key=lambda x: x['total_count'], reverse=True)

    return user_stats

@router.get("/dashboard/timeline")
async def get_timeline_stats(session: Session = Depends(get_session)):
    """Get daily timeline statistics"""

    # Get decisions grouped by date
    decisions = session.exec(
        select(
            func.date(Decision.timestamp).label('date'),
            func.count(Decision.id).label('count')
        )
        .group_by(func.date(Decision.timestamp))
        .order_by(func.date(Decision.timestamp))
    ).all()

    timeline = [
        {
            "date": str(date),
            "count": count
        }
        for date, count in decisions
    ]

    return timeline

@router.get("/dashboard/action-breakdown")
async def get_action_breakdown(session: Session = Depends(get_session)):
    """Get breakdown of decision actions"""

    actions = session.exec(
        select(Decision.action, func.count(Decision.id).label('count'))
        .group_by(Decision.action)
    ).all()

    breakdown = [
        {
            "action": action,
            "count": count
        }
        for action, count in actions
    ]

    return breakdown
