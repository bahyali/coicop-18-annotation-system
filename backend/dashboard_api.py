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


@router.get("/dashboard/user-detailed-stats/{reviewer_id}")
async def get_user_detailed_stats(reviewer_id: str, session: Session = Depends(get_session)):
    """Get detailed statistics for a specific user with time-based breakdowns"""

    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), datetime.min.time())
    week_start = today_start - timedelta(days=now.weekday())
    month_start = datetime.combine(now.date().replace(day=1), datetime.min.time())

    # Total stats
    total_count = session.exec(
        select(func.count(Decision.id))
        .where(Decision.reviewer_id == reviewer_id)
    ).one()

    total_time = session.exec(
        select(func.sum(Decision.time_spent_ms))
        .where(Decision.reviewer_id == reviewer_id)
    ).one() or 0

    # Today's stats
    today_count = session.exec(
        select(func.count(Decision.id))
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= today_start
        ))
    ).one()

    today_time = session.exec(
        select(func.sum(Decision.time_spent_ms))
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= today_start
        ))
    ).one() or 0

    # This week's stats
    week_count = session.exec(
        select(func.count(Decision.id))
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= week_start
        ))
    ).one()

    week_time = session.exec(
        select(func.sum(Decision.time_spent_ms))
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= week_start
        ))
    ).one() or 0

    # This month's stats
    month_count = session.exec(
        select(func.count(Decision.id))
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= month_start
        ))
    ).one()

    month_time = session.exec(
        select(func.sum(Decision.time_spent_ms))
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= month_start
        ))
    ).one() or 0

    # Action breakdown for this user
    actions = session.exec(
        select(Decision.action, func.count(Decision.id).label('count'))
        .where(Decision.reviewer_id == reviewer_id)
        .group_by(Decision.action)
    ).all()

    action_breakdown = {action: count for action, count in actions}

    # Agreement rate
    accept_count = action_breakdown.get('accept', 0)
    agreement_rate = (accept_count / total_count * 100) if total_count > 0 else 0

    # Daily breakdown for last 30 days
    thirty_days_ago = today_start - timedelta(days=30)
    daily_stats = session.exec(
        select(
            func.date(Decision.timestamp).label('date'),
            func.count(Decision.id).label('count'),
            func.sum(Decision.time_spent_ms).label('time_ms')
        )
        .where(and_(
            Decision.reviewer_id == reviewer_id,
            Decision.timestamp >= thirty_days_ago
        ))
        .group_by(func.date(Decision.timestamp))
        .order_by(func.date(Decision.timestamp))
    ).all()

    daily_breakdown = [
        {
            "date": str(date),
            "count": count,
            "time_minutes": round((time_ms or 0) / 60000, 1)
        }
        for date, count, time_ms in daily_stats
    ]

    # Weekly breakdown for last 12 weeks
    weekly_stats = []
    for i in range(12):
        week_end = week_start - timedelta(weeks=i)
        week_begin = week_end - timedelta(days=7)

        week_data = session.exec(
            select(
                func.count(Decision.id).label('count'),
                func.sum(Decision.time_spent_ms).label('time_ms')
            )
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.timestamp >= week_begin,
                Decision.timestamp < week_end
            ))
        ).one()

        weekly_stats.append({
            "week_start": str(week_begin.date()),
            "week_end": str(week_end.date()),
            "count": week_data[0] or 0,
            "time_minutes": round((week_data[1] or 0) / 60000, 1)
        })

    weekly_stats.reverse()

    return {
        "reviewer_id": reviewer_id,
        "total": {
            "count": total_count,
            "time_minutes": round(total_time / 60000, 1),
            "avg_time_seconds": round(total_time / total_count / 1000, 2) if total_count > 0 else 0
        },
        "today": {
            "count": today_count,
            "time_minutes": round(today_time / 60000, 1),
            "avg_time_seconds": round(today_time / today_count / 1000, 2) if today_count > 0 else 0
        },
        "this_week": {
            "count": week_count,
            "time_minutes": round(week_time / 60000, 1),
            "avg_time_seconds": round(week_time / week_count / 1000, 2) if week_count > 0 else 0
        },
        "this_month": {
            "count": month_count,
            "time_minutes": round(month_time / 60000, 1),
            "avg_time_seconds": round(month_time / month_count / 1000, 2) if month_count > 0 else 0
        },
        "agreement_rate": round(agreement_rate, 2),
        "action_breakdown": action_breakdown,
        "daily_breakdown": daily_breakdown,
        "weekly_breakdown": weekly_stats
    }


@router.get("/dashboard/all-users-detailed-stats")
async def get_all_users_detailed_stats(session: Session = Depends(get_session)):
    """Get detailed statistics for all users with time-based breakdowns"""

    now = datetime.utcnow()
    today_start = datetime.combine(now.date(), datetime.min.time())
    week_start = today_start - timedelta(days=now.weekday())
    month_start = datetime.combine(now.date().replace(day=1), datetime.min.time())

    # Get all unique reviewers
    reviewers = session.exec(
        select(Decision.reviewer_id).distinct()
    ).all()

    all_stats = []

    for reviewer_id in reviewers:
        # Total stats
        total_count = session.exec(
            select(func.count(Decision.id))
            .where(Decision.reviewer_id == reviewer_id)
        ).one()

        total_time = session.exec(
            select(func.sum(Decision.time_spent_ms))
            .where(Decision.reviewer_id == reviewer_id)
        ).one() or 0

        # Today's stats
        today_count = session.exec(
            select(func.count(Decision.id))
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.timestamp >= today_start
            ))
        ).one()

        # This week's stats
        week_count = session.exec(
            select(func.count(Decision.id))
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.timestamp >= week_start
            ))
        ).one()

        # This month's stats
        month_count = session.exec(
            select(func.count(Decision.id))
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.timestamp >= month_start
            ))
        ).one()

        # Agreement rate
        accept_count = session.exec(
            select(func.count(Decision.id))
            .where(and_(
                Decision.reviewer_id == reviewer_id,
                Decision.action == "accept"
            ))
        ).one()

        agreement_rate = (accept_count / total_count * 100) if total_count > 0 else 0

        all_stats.append({
            "reviewer_id": reviewer_id,
            "total_count": total_count,
            "today_count": today_count,
            "week_count": week_count,
            "month_count": month_count,
            "total_time_minutes": round(total_time / 60000, 1),
            "avg_time_seconds": round(total_time / total_count / 1000, 2) if total_count > 0 else 0,
            "agreement_rate": round(agreement_rate, 2)
        })

    # Sort by total count
    all_stats.sort(key=lambda x: x['total_count'], reverse=True)

    return all_stats
