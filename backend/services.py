from sqlmodel import Session, select
from models import Item, Decision, Classification
from typing import Optional, List
import pandas as pd
import uuid
from datetime import datetime
import json
from pathlib import Path
from sqlalchemy import func, or_

BASE_DIR = Path(__file__).resolve().parent

def _resolve_path(file_path: str) -> Path:
    path = Path(file_path)
    if not path.is_absolute():
        path = BASE_DIR / path
    return path

def load_coicop_data(session: Session, file_path: str = "raw_coicop.json"):
    try:
        existing = session.exec(select(Classification).limit(1)).first()
        if existing:
            return

        data_path = _resolve_path(file_path)
        if not data_path.exists():
            print("COICOP file not found. Skipping load.")
            return

        with data_path.open("r", encoding="utf-8") as f:
            raw_entries = json.load(f)

        for entry in raw_entries:
            code = entry.get("code")
            if not code:
                continue
            classification = Classification(
                code=str(code),
                title=entry.get("title", "Untitled"),
                intro=entry.get("intro"),
                includes=entry.get("includes"),
                also_includes=entry.get("alsoIncludes"),
                excludes=entry.get("excludes"),
            )
            session.add(classification)

        session.commit()
        print(f"Loaded {len(raw_entries)} COICOP classifications.")
    except Exception as e:
        print(f"Error loading COICOP data: {e}")

def load_initial_data(session: Session, file_path: str = "dataset.csv"):
    try:
        # Check if DB is empty
        statement = select(Item).limit(1)
        result = session.exec(statement).first()
        if result:
            return # Already loaded

        data_path = _resolve_path(file_path)

        # Try loading from CSV
        try:
            df = pd.read_csv(data_path)

            def normalize_code(value) -> Optional[str]:
                if pd.isna(value):
                    return None
                text = str(value).strip()
                return text or None

            def lookup_title(code: Optional[str]) -> Optional[str]:
                if not code:
                    return None
                classification = session.get(Classification, code)
                return classification.title if classification else None

            for _, row in df.iterrows():
                existing_code = normalize_code(row.get("code"))
                model_code = normalize_code(row.get("model_code"))

                item = Item(
                    id=str(row.get("id", uuid.uuid4())),
                    description=row.get("description", "No description"),
                    existing_code=existing_code,
                    existing_label=lookup_title(existing_code),
                    model_code=model_code,
                    model_label=lookup_title(model_code),
                    confidence_score=float(row.get("confidence", 0.0)),
                    status="pending"
                )
                session.add(item)
            session.commit()
            print(f"Loaded {len(df)} items.")
        except FileNotFoundError:
            print("Dataset file not found. Skipping load.")
            # Optional: Generate dummy data for testing
            pass

    except Exception as e:
        print(f"Error loading data: {e}")

def get_next_item(session: Session, user_id: str, queue_filter: Optional[str] = None) -> Optional[Item]:
    # Logic:
    # 1. Check if user has a locked item
    # 2. If not, find oldest pending item in the queue
    # 3. Lock it
    
    # Check locked
    stmt = select(Item).where(Item.locked_by == user_id, Item.status == "locked")
    locked_item = session.exec(stmt).first()
    if locked_item:
        return locked_item
        
    # Get next pending
    query = select(Item).where(Item.status == "pending")
    if queue_filter:
        query = query.where(Item.queue == queue_filter)
    
    # Order by priority/FIFO. For now, just random or by ID.
    # Let's order by confidence descending for high confidence queue?
    # Or just arbitrary order.
    query = query.limit(1)
    
    item = session.exec(query).first()
    
    if item:
        item.status = "locked"
        item.locked_by = user_id
        item.locked_at = datetime.utcnow()
        session.add(item)
        session.commit()
        session.refresh(item)
        
    return item

def submit_decision(session: Session, decision: Decision):
    session.add(decision)

    item = session.get(Item, decision.item_id)
    if item:
        item.status = "completed" if decision.action != "escalate" else "escalated"
        # Determine final_code logic if needed, but decision has it
        session.add(item)

    session.commit()

    # Auto-save results to CSV after each decision
    export_results_to_csv(session)

    return item

def export_results_to_csv(session: Session):
    """Export all decisions and items to CSV in results folder"""
    try:
        results_dir = Path("/app/results")
        results_dir.mkdir(exist_ok=True)

        # Get all items with their decisions
        items = session.exec(select(Item)).all()
        decisions = session.exec(select(Decision)).all()

        # Create decisions lookup
        decision_map = {d.item_id: d for d in decisions}

        # Build results data
        results = []
        for item in items:
            decision = decision_map.get(item.id)
            results.append({
                'id': item.id,
                'description': item.description,
                'existing_code': item.existing_code,
                'model_code': item.model_code,
                'status': item.status,
                'final_code': decision.final_code if decision else '',
                'action': decision.action if decision else '',
                'reviewer_id': decision.reviewer_id if decision else '',
                'reviewed_at': decision.timestamp if decision else '',
                'escalation_reason': decision.escalation_reason if decision else ''
            })

        # Save to CSV
        df = pd.DataFrame(results)
        df.to_csv(results_dir / 'validation_results.csv', index=False, encoding='utf-8-sig')

        # Also save summary
        summary = {
            'total_items': len(items),
            'completed': len([i for i in items if i.status == 'completed']),
            'pending': len([i for i in items if i.status == 'pending']),
            'escalated': len([i for i in items if i.status == 'escalated']),
            'last_updated': datetime.utcnow().isoformat()
        }
        with open(results_dir / 'summary.json', 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)

        print(f"Results exported: {len(results)} items")
    except Exception as e:
        print(f"Error exporting results: {e}")

def get_classification(session: Session, code: str) -> Optional[Classification]:
    return session.get(Classification, code)

def search_classifications(session: Session, query: str = "", limit: int = 10) -> List[Classification]:
    statement = select(Classification)
    if query:
        lowered = f"%{query.lower()}%"
        statement = statement.where(
            or_(
                func.lower(Classification.code).like(lowered),
                func.lower(Classification.title).like(lowered),
                func.lower(Classification.intro).like(lowered),
            )
        )
    statement = statement.order_by(Classification.code).limit(limit)
    return session.exec(statement).all()


def get_stats(session: Session) -> dict:
    """Get statistics about items"""
    items = session.exec(select(Item)).all()

    stats = {
        "total": len(items),
        "pending": len([i for i in items if i.status == "pending"]),
        "locked": len([i for i in items if i.status == "locked"]),
        "completed": len([i for i in items if i.status == "completed"]),
        "escalated": len([i for i in items if i.status == "escalated"]),
    }

    # Get locked items details
    locked_items = [
        {"id": i.id, "description": i.description[:50], "locked_by": i.locked_by, "locked_at": str(i.locked_at)}
        for i in items if i.status == "locked"
    ]
    stats["locked_items"] = locked_items

    # Get escalated items details
    escalated_items = [
        {"id": i.id, "description": i.description[:50]}
        for i in items if i.status == "escalated"
    ]
    stats["escalated_items"] = escalated_items

    return stats


def unlock_item(session: Session, item_id: str) -> Optional[Item]:
    """Unlock a specific item and return it to pending"""
    item = session.get(Item, item_id)
    if item and item.status == "locked":
        item.status = "pending"
        item.locked_by = None
        item.locked_at = None
        session.add(item)
        session.commit()
        session.refresh(item)
        return item
    return None


def unlock_all_items(session: Session) -> int:
    """Unlock all locked items and return them to pending"""
    stmt = select(Item).where(Item.status == "locked")
    locked_items = session.exec(stmt).all()

    count = 0
    for item in locked_items:
        item.status = "pending"
        item.locked_by = None
        item.locked_at = None
        session.add(item)
        count += 1

    session.commit()
    return count


def requeue_escalated(session: Session) -> int:
    """Return all escalated items to pending for second round review"""
    stmt = select(Item).where(Item.status == "escalated")
    escalated_items = session.exec(stmt).all()

    count = 0
    for item in escalated_items:
        item.status = "pending"
        item.locked_by = None
        item.locked_at = None
        session.add(item)
        count += 1

    session.commit()
    return count


def reset_stale_locks(session: Session, max_age_minutes: int = 30) -> int:
    """Reset items that have been locked for too long"""
    from datetime import timedelta

    cutoff = datetime.utcnow() - timedelta(minutes=max_age_minutes)
    stmt = select(Item).where(
        Item.status == "locked",
        Item.locked_at < cutoff
    )
    stale_items = session.exec(stmt).all()

    count = 0
    for item in stale_items:
        item.status = "pending"
        item.locked_by = None
        item.locked_at = None
        session.add(item)
        count += 1

    session.commit()
    return count
