from typing import Optional, List, Dict
from datetime import datetime
from sqlmodel import Field, SQLModel, JSON

class Item(SQLModel, table=True):
    id: str = Field(primary_key=True)
    description: str
    meta_data: Optional[Dict] = Field(default={}, sa_type=JSON)
    existing_code: Optional[str] = None
    existing_label: Optional[str] = None
    
    # Model predictions
    model_code: Optional[str] = None
    model_label: Optional[str] = None
    confidence_score: float = 0.0
    
    # Validation state
    status: str = Field(default="pending") # pending, locked, completed, escalated
    queue: str = Field(default="high_confidence") # high_confidence, low_confidence
    locked_by: Optional[str] = None
    locked_at: Optional[datetime] = None

class Decision(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    item_id: str = Field(foreign_key="item.id")
    reviewer_id: str
    action: str # accept, fix, escalate
    final_code: str
    escalation_reason: Optional[str] = None
    time_spent_ms: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class User(SQLModel, table=True):
    username: str = Field(primary_key=True)
    role: str = "reviewer" # reviewer, senior, admin

class Classification(SQLModel, table=True):
    code: str = Field(primary_key=True)
    title: str
    intro: Optional[str] = None
    includes: Optional[str] = None
    also_includes: Optional[str] = None
    excludes: Optional[str] = None
