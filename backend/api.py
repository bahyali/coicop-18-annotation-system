from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from database import get_session
from models import Item, Decision
import services
from typing import Optional

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
def get_stats(session: Session = Depends(get_session)):
    # Simple stats placeholder
    return {"status": "ok"}
