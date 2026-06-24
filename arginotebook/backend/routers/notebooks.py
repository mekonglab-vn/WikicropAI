from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from databases.connection import get_db
from databases import crud_notebook
from schemas import notebook_schema

router = APIRouter(prefix="/api/v1/notebooks", tags=["Notebooks & Sources"])

@router.post("/", response_model=notebook_schema.NotebookResponse)
def create_notebook(notebook: notebook_schema.NotebookCreate, db: Session = Depends(get_db)):
    return crud_notebook.create_notebook(db=db, notebook=notebook)

@router.get("/user/{user_id}", response_model=list[notebook_schema.NotebookResponse])
def get_user_notebooks(user_id: int, db: Session = Depends(get_db)):

    return crud_notebook.get_notebooks_by_user(db=db, user_id=user_id)

@router.get("/{notebook_id}", response_model=notebook_schema.NotebookResponse)
def get_notebook(notebook_id: int, db: Session = Depends(get_db)):

    db_notebook = crud_notebook.get_notebook_by_id(db, notebook_id=notebook_id)
    if not db_notebook:
        raise HTTPException(status_code=404, detail="Sổ tay không tồn tại")
    return db_notebook

from config_loader import load_chroma_client
chroma_client, collection = load_chroma_client()



@router.delete("/{notebook_id}")
def delete_notebook(notebook_id: int, db: Session = Depends(get_db)):
    deleted = crud_notebook.delete_notebook_logic(db=db, notebook_id=notebook_id, chroma_collection=collection)
    if not deleted:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return {"message": "Notebook and all documents deleted successfully"}


@router.post("/{notebook_id}/sources/", response_model=notebook_schema.SourceResponse)
def add_source_to_notebook(notebook_id: int, source: notebook_schema.SourceBase, db: Session = Depends(get_db)):
    db_notebook = crud_notebook.get_notebook_by_id(db, notebook_id=notebook_id)
    if not db_notebook:
        raise HTTPException(status_code=404, detail="Sổ tay không tồn tại")
    
    source_create = notebook_schema.SourceCreate(**source.model_dump(), notebook_id=notebook_id)
    return crud_notebook.create_source(db=db, source=source_create)

@router.put("/sources/{source_id}/status", response_model=notebook_schema.SourceResponse)
def update_source_status(source_id: int, status: str, db: Session = Depends(get_db)):
    updated_source = crud_notebook.update_source_status(db, source_id, status)
    if not updated_source:
        raise HTTPException(status_code=404, detail="Source not found")
    return updated_source

