from sqlalchemy.orm import Session
from databases import models
from schemas import llm_schema

def create_llm_config(db: Session, llm: llm_schema.LLMConfigCreate):
    db_llm = models.LLMConfig(**llm.model_dump())
    db.add(db_llm)
    db.commit()
    db.refresh(db_llm)
    return db_llm

def get_llms_by_user(db: Session, user_id: int):
    return db.query(models.LLMConfig).filter(models.LLMConfig.user_id == user_id).all()

def set_active_llm(db: Session, user_id: int, llm_id: int):
    db.query(models.LLMConfig).filter(models.LLMConfig.user_id == user_id).update({"is_active": False})
    
    active_llm = db.query(models.LLMConfig).filter(models.LLMConfig.id == llm_id, models.LLMConfig.user_id == user_id).first()
    if active_llm:
        active_llm.is_active = True
        db.commit()
        db.refresh(active_llm)
    return active_llm

def update_llm_config(db: Session, llm_id: int, llm_update: llm_schema.LLMConfigUpdate):
    db_llm = db.query(models.LLMConfig).filter(models.LLMConfig.id == llm_id).first()
    if not db_llm:
        return None
    for key, value in llm_update.model_dump(exclude_unset=True).items():
        setattr(db_llm, key, value)
    db.commit()
    db.refresh(db_llm)
    return db_llm

def delete_llm_config(db: Session, llm_id: int):
    db_llm = db.query(models.LLMConfig).filter(models.LLMConfig.id == llm_id).first()
    if db_llm:
        db.delete(db_llm)
        db.commit()
    return db_llm