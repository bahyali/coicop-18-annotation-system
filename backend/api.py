from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from database import get_session
from models import Item, Decision, Classification, User
import services
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter()

@router.get("/items/next", response_model=Optional[Item])
def get_next_item(
    user_id: str, 
    queue: Optional[str] = None, 
    session: Session = Depends(get_session)
):
    item = services.get_next_item(session, user_id, queue)
    if not item:
        raise HTTPException(status_code=404, detail="No more items in queue")
    return item

@router.post("/decisions", response_model=Item)
def submit_decision(decision: Decision, session: Session = Depends(get_session)):
    try:
        updated_item = services.submit_decision(session, decision)
        return updated_item
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats(user_id: str = None, session: Session = Depends(get_session)):
    """Get detailed statistics about items, optionally filtered by user_id"""
    return services.get_stats(session, user_id)


@router.post("/unlock/{item_id}")
def unlock_item(item_id: str, session: Session = Depends(get_session)):
    """Unlock a specific item and return it to pending"""
    item = services.unlock_item(session, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or not locked")
    return {"message": f"Item {item_id} unlocked", "item": item}


@router.post("/unlock-all")
def unlock_all_items(session: Session = Depends(get_session)):
    """Unlock all locked items and return them to pending"""
    count = services.unlock_all_items(session)
    return {"message": f"Unlocked {count} items", "count": count}


@router.post("/requeue-escalated")
def requeue_escalated(session: Session = Depends(get_session)):
    """Return all escalated items to pending for second round review"""
    count = services.requeue_escalated(session)
    return {"message": f"Requeued {count} escalated items", "count": count}


@router.post("/reset-stale-locks")
def reset_stale_locks(max_age_minutes: int = 30, session: Session = Depends(get_session)):
    """Reset items that have been locked for too long"""
    count = services.reset_stale_locks(session, max_age_minutes)
    return {"message": f"Reset {count} stale locks", "count": count}

@router.get("/classifications/{code}", response_model=Classification)
def fetch_classification(code: str, session: Session = Depends(get_session)):
    classification = services.get_classification(session, code)
    if not classification:
        raise HTTPException(status_code=404, detail="Classification not found")
    return classification

@router.get("/classifications", response_model=List[Classification])
def search_classifications(
    query: str = "",
    limit: int = 10,
    session: Session = Depends(get_session)
):
    limit = max(1, min(limit, 50))
    results = services.search_classifications(session, query, limit)
    return results


# User Management Endpoints

class UserCreate(BaseModel):
    username: str
    role: str = "reviewer"


@router.get("/users", response_model=List[User])
def list_users(session: Session = Depends(get_session)):
    """Get all registered users"""
    users = session.exec(select(User).order_by(User.username)).all()
    return users


@router.get("/users/{username}", response_model=User)
def get_user(username: str, session: Session = Depends(get_session)):
    """Get a specific user by username"""
    user = session.get(User, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/users", response_model=User)
def create_user(user_data: UserCreate, session: Session = Depends(get_session)):
    """Create a new user"""
    # Check if user already exists
    existing = session.get(User, user_data.username)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    # Validate role
    valid_roles = ["reviewer", "senior", "admin"]
    if user_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")

    user = User(username=user_data.username, role=user_data.role)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.delete("/users/{username}")
def delete_user(username: str, session: Session = Depends(get_session)):
    """Delete a user"""
    user = session.get(User, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session.delete(user)
    session.commit()
    return {"message": f"User {username} deleted"}
