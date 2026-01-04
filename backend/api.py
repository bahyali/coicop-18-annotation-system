from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from database import get_session
from models import Item, Decision, Classification
import services
from typing import Optional, List

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
