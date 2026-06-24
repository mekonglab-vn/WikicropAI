from sqlalchemy.orm import Session
from databases import models
from schemas import notebook_schema

def create_notebook(db: Session, notebook: notebook_schema.NotebookCreate):
    db_notebook = models.Notebook(**notebook.model_dump())
    db.add(db_notebook)
    db.commit()
    db.refresh(db_notebook)
    return db_notebook

def get_notebooks_by_user(db: Session, user_id: int):
    return db.query(models.Notebook).filter(models.Notebook.user_id == user_id).all()

def get_notebook_by_id(db: Session, notebook_id: int):
    return db.query(models.Notebook).filter(models.Notebook.id == notebook_id).first()

def delete_notebook_logic(db: Session, notebook_id: int, chroma_collection):

    db_notebook = get_notebook_by_id(db, notebook_id)
    if not db_notebook:
        return False

    chunk_uuids = []
    
    if hasattr(db_notebook, 'sources') and db_notebook.sources:
        for source in db_notebook.sources:
            if hasattr(source, 'chunks') and source.chunks:
                for chunk in source.chunks:
                    if chunk.chunk_index:
                        chunk_uuids.append(str(chunk.chunk_index))

    if chunk_uuids:
        try:
            chroma_collection.delete(ids=chunk_uuids)
        except Exception as e:
            print(f"ChromaDB deletion error: {e}")
            return False

    db.delete(db_notebook)
    db.commit()
    return True

def create_source(db: Session, source: notebook_schema.SourceCreate):
    db_source = models.Source(**source.model_dump())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

def update_source_status(db: Session, source_id: int, status: str):
    db_source = db.query(models.Source).filter(models.Source.id == source_id).first()
    if db_source:
        db_source.status = status
        db.commit()
        db.refresh(db_source)
    return db_source


def get_sources_by_notebook(db: Session, notebook_id: int):
    return db.query(models.Source).filter(models.Source.notebook_id == notebook_id).all()

def get_source_by_id(db: Session, source_id: int):
    return db.query(models.Source).filter(models.Source.id == source_id).first()


def delete_source_chunk_logic(db: Session, chunk_id: int, chroma_collection):

    chunk = db.query(models.SourceChunk).filter(models.SourceChunk.id == chunk_id).first()
    if not chunk:
        return False
        
    chunk_uuid = str(chunk.chunk_index)

    try:
        chroma_collection.delete(ids=[chunk_uuid])
    except Exception as e:
        print(f"ChromaDB deletion error: {e}")
        return False

    db.delete(chunk)
    db.commit()
    return True

def delete_source_logic(db: Session, source_id: int, chroma_collection):

    source = db.query(models.Source).filter(models.Source.id == source_id).first()
    if not source:
        return False
        
    chunk_uuids = [str(c.chunk_index) for c in source.chunks if c.chunk_index]
    
    if chunk_uuids:
        try:
            chroma_collection.delete(ids=chunk_uuids)
        except Exception as e:
            print(f"ChromaDB deletion error: {e}")
            return False
            
    db.delete(source)
    db.commit()
    return True



