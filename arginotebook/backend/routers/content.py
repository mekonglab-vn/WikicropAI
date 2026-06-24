from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from databases.connection import get_db
from databases import crud_content, crud_notebook
from schemas import content_schema
from typing import List

router = APIRouter(prefix="/api/v1", tags=["Content & Generation"])

# ----------------- TEMPLATES -----------------
@router.get("/templates", response_model=list[content_schema.TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    return crud_content.get_all_templates(db)

@router.post("/templates", response_model=content_schema.TemplateResponse)
def add_template(template: content_schema.TemplateCreate, db: Session = Depends(get_db)):
    return crud_content.create_template(db, template)

@router.get("/templates/{user_id}", response_model=List[content_schema.TemplateResponse])
def read_templates(user_id: int, db: Session = Depends(get_db)):
    return crud_content.get_templates_by_user(db, user_id)

@router.put("/templates/{template_id}", response_model=content_schema.TemplateResponse)
def update_template(template_id: int, template_update: content_schema.TemplateCreate, db: Session = Depends(get_db)):
    updated_template = crud_content.update_template(db, template_id, template_update=template_update)
    
    if not updated_template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    return updated_template

@router.delete("/templates/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    success = crud_content.delete_template(db, template_id)
    if not success:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}

# ----------------- CHUNKS -----------------
@router.post("/sources/{source_id}/chunks", response_model=content_schema.SourceChunkResponse)
def add_chunk_to_source(source_id: int, chunk: content_schema.SourceChunkBase, db: Session = Depends(get_db)):
    chunk_data = content_schema.SourceChunkCreate(**chunk.model_dump(), source_id=source_id)
    return crud_content.create_chunk(db, chunk_data)

@router.get("/sources/{source_id}/chunks", response_model=list[content_schema.SourceChunkResponse])
def get_source_chunks(source_id: int, db: Session = Depends(get_db)):
    return crud_content.get_chunks_by_source(db, source_id)

@router.get("/sources/{source_id}/chunks/{chunk_index}", response_model=content_schema.SourceChunkResponse)
def get_chunk_by_index(source_id: int, chunk_index: str, db: Session =  Depends(get_db)):
    chunk = crud_content.get_chunks_by_chunk_index(db, source_id, chunk_index)
    if not chunk:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return chunk

@router.get("/notebooks/{notebook_id}/sources", response_model=List[content_schema.SourceResponse])
def read_sources_by_notebook(notebook_id: int, db: Session = Depends(get_db)):
    sources = crud_notebook.get_sources_by_notebook(db, notebook_id=notebook_id)
    return sources

@router.get("/sources/{source_id}/chunks", response_model=List[content_schema.SourceChunkResponse])
def read_chunks_by_source(source_id: int, db: Session = Depends(get_db)):
    chunks = crud_notebook.get_chunks_by_source(db, source_id=source_id)
    if not chunks:
        raise HTTPException(
            status_code=404, 
            detail="No chunks found for this source"
        )
    return chunks


from config_loader import load_chroma_client
chroma_client, collection = load_chroma_client()


@router.delete("/sources/{source_id}")
def remove_source(source_id: int, db: Session = Depends(get_db)):
    success = crud_notebook.delete_source_logic(db, source_id, collection)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete source"
        )
    return {"message": "Source and vector data deleted successfully"}

@router.delete("/chunks/{chunk_id}")
def remove_source_chunk(chunk_id: int, db: Session = Depends(get_db)):
    success = crud_notebook.delete_source_chunk_logic(db, chunk_id, collection)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete chunk"
        )
    return {"message": "Chunk and vector data deleted successfully"}


# ----------------- ARTICLES & CITATIONS -----------------
@router.post("/notebooks/{notebook_id}/articles", response_model=content_schema.ArticleResponse)
def save_generated_article(notebook_id: int, template_id: int, article: content_schema.ArticleBase, db: Session = Depends(get_db)):
    article_data = content_schema.ArticleCreate(
        final_content=article.final_content, 
        bibliography=article.bibliography,
        notebook_id=notebook_id, 
        template_id=template_id
    )
    return crud_content.create_article(db, article_data)

@router.get("/notebooks/{notebook_id}/articles", response_model=list[content_schema.ArticleResponse])
def get_notebook_articles(notebook_id: int, db: Session = Depends(get_db)):
    return crud_content.get_articles_by_notebook(db, notebook_id)

@router.put("/articles/{article_id}", response_model=content_schema.ArticleResponse)
def update_existing_article(article_id: int, article_update: content_schema.ArticleUpdate, db: Session = Depends(get_db)):
    updated_article = crud_content.update_article(db, article_id, article_update)
    
    if not updated_article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    return updated_article


# CITATIONS API
@router.post("/articles/{article_id}/citations", response_model=content_schema.CitationResponse)
def add_citation_to_article(article_id: int, citation: content_schema.CitationBase, chunk_id: int, db: Session = Depends(get_db)):
    citation_data = content_schema.CitationCreate(
        **citation.model_dump(), 
        article_id=article_id, 
        chunk_id=chunk_id
    )
    return crud_content.create_citation(db, citation_data)


# SOURCE API
@router.get("/sources/{source_id}", response_model=content_schema.SourceResponse)
def get_source_details(source_id: int, db: Session = Depends(get_db)):
    db_source = crud_notebook.get_source_by_id(db, source_id)
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    return db_source

# MINDMAP API
@router.post("/mindmaps", response_model=content_schema.MindmapResponse)
def create_new_mindmap(mindmap: content_schema.MindmapCreate, db: Session = Depends(get_db)):
    return crud_content.create_mindmap(db, mindmap)

@router.get("/notebooks/{notebook_id}/mindmap", response_model=content_schema.MindmapResponse)
def get_notebook_mindmap(notebook_id: int, db: Session = Depends(get_db)):
    db_mindmap = crud_content.get_mindmap_by_notebook(db, notebook_id)
    if not db_mindmap:
        raise HTTPException(status_code=404, detail="Mindmap not found")
    return db_mindmap

@router.put("/mindmaps/{mindmap_id}", response_model=content_schema.MindmapResponse)
def update_existing_mindmap(mindmap_id: int, mindmap_update: content_schema.MindmapUpdate, db: Session = Depends(get_db)):
    updated_mindmap = crud_content.update_mindmap(db, mindmap_id, mindmap_update)
    if not updated_mindmap:
        raise HTTPException(status_code=404, detail="Mindmap not found")
    return updated_mindmap

@router.delete("/mindmaps/{mindmap_id}")
def delete_existing_mindmap(mindmap_id: int, db: Session = Depends(get_db)):
    success = crud_content.delete_mindmap(db, mindmap_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mindmap not found")
    return {"message": "Deleted successfully"}