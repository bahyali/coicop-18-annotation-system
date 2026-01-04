from sqlmodel import Session, select
from models import Item, Decision
from typing import Optional, List
import pandas as pd
import uuid
from datetime import datetime

def load_initial_data(session: Session, file_path: str = "dataset.csv"):
    try:
        # Check if DB is empty
        statement = select(Item).limit(1)
        result = session.exec(statement).first()
        if result:
            return # Already loaded

        # Try loading from CSV
        try:
            df = pd.read_csv(file_path)
            for _, row in df.iterrows():
                item = Item(
                    id=str(row.get("id", uuid.uuid4())),
                    description=row.get("description", "No description"),
                    existing_code=str(row.get("code", "")),
                    model_code=str(row.get("model_code", "")),
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
    return item
