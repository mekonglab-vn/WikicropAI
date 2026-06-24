from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- SCHEMAS CHO SOURCE ---
class SourceBase(BaseModel):
    title: str
    type: str # web, pdf, youtube...
    url_or_path: str
    status: Optional[str] = "processing"

class SourceCreate(SourceBase):
    notebook_id: int

class SourceResponse(SourceBase):
    id: int
    notebook_id: int

    class Config:
        from_attributes = True

# --- SCHEMAS CHO NOTEBOOK ---
class NotebookBase(BaseModel):
    name: str

class NotebookCreate(NotebookBase):
    user_id: int

class NotebookResponse(NotebookBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    sources: List[SourceResponse] = [] 

    class Config:
        from_attributes = True
        