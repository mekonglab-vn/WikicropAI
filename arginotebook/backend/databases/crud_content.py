from sqlalchemy.orm import Session
from databases import models
from schemas import content_schema
import json

def create_chunk(db: Session, chunk: content_schema.SourceChunkCreate):
    db_chunk = models.SourceChunk(**chunk.model_dump())
    db.add(db_chunk)
    db.commit()
    db.refresh(db_chunk)
    return db_chunk


def get_chunks_by_chunk_index(db: Session, source_id: int, chunk_index: str):
    
    return db.query(models.SourceChunk).filter(
        models.SourceChunk.source_id == source_id,
        models.SourceChunk.chunk_index == chunk_index
    ).first()


def get_chunks_by_source(db: Session, source_id: int):
    return db.query(models.SourceChunk).filter(models.SourceChunk.source_id == source_id).all()

def create_template(db: Session, template: content_schema.TemplateCreate):
    db_template = models.Template(**template.model_dump())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

def get_all_templates(db: Session):
    return db.query(models.Template).filter(models.Template.status == 1).all()

def get_templates_by_user(db: Session, user_id: int):
    return db.query(models.Template).filter(models.Template.user_id == user_id, models.Template.status == 1).all()

def update_template(db: Session, template_id: int, template_update: content_schema.TemplateCreate):
    db_template = db.query(models.Template).filter(models.Template.id == template_id).first()
    
    if db_template:
        update_data = template_update.model_dump(exclude_unset=True) 
        
        for key, value in update_data.items():
            setattr(db_template, key, value)
            
        db.commit()
        db.refresh(db_template)
        
    return db_template

def delete_template(db: Session, template_id: int):
    db_template = db.query(models.Template).filter(models.Template.id == template_id).first()
    
    if db_template:
        db_template.status = 0
        db.commit()
        return True
    return False
def create_article(db: Session, article: content_schema.ArticleCreate):
    db_article = models.Article(**article.model_dump())
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

def get_articles_by_notebook(db: Session, notebook_id: int):
    return db.query(models.Article).filter(models.Article.notebook_id == notebook_id).all()

def get_article_by_id(db: Session, article_id: int):
    return db.query(models.Article).filter(models.Article.id == article_id).first()

def update_article(db: Session, article_id: int, article_update: content_schema.ArticleUpdate):
    db_article = get_article_by_id(db, article_id)
    
    if db_article:
        update_data = article_update.model_dump(exclude_unset=True) 
        
        for key, value in update_data.items():
            setattr(db_article, key, value)
            
        db.commit()
        db.refresh(db_article)
        
    return db_article

def create_citation(db: Session, citation: content_schema.CitationCreate):
    db_citation = models.Citation(**citation.model_dump())
    db.add(db_citation)
    db.commit()
    db.refresh(db_citation)
    return db_citation


# MINDMAP CRUD
def create_mindmap(db: Session, mindmap: content_schema.MindmapCreate):
    db_mindmap = models.Mindmap(**mindmap.model_dump())
    db.add(db_mindmap)
    db.commit()
    db.refresh(db_mindmap)
    return db_mindmap

def get_mindmap_by_notebook(db: Session, notebook_id: int):
    return db.query(models.Mindmap).filter(models.Mindmap.notebook_id == notebook_id).order_by(models.Mindmap.id.desc()).first()

def get_mindmap_by_id(db: Session, mindmap_id: int):
    return db.query(models.Mindmap).filter(models.Mindmap.id == mindmap_id).first()

def update_mindmap(db: Session, mindmap_id: int, mindmap_update: content_schema.MindmapUpdate):
    db_mindmap = get_mindmap_by_id(db, mindmap_id)
    if db_mindmap:
        update_data = mindmap_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_mindmap, key, value)
        db.commit()
        db.refresh(db_mindmap)
    return db_mindmap

def delete_mindmap(db: Session, mindmap_id: int):
    db_mindmap = get_mindmap_by_id(db, mindmap_id)
    if db_mindmap:
        db.delete(db_mindmap)
        db.commit()
        return True
    return False
