from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from databases.connection import get_db
from databases import crud_llm
from schemas import llm_schema

router = APIRouter(prefix="/api/v1/llms", tags=["LLM Configs"])

@router.post("/", response_model=llm_schema.LLMConfigResponse)
def create_llm(llm: llm_schema.LLMConfigCreate, db: Session = Depends(get_db)):
    return crud_llm.create_llm_config(db=db, llm=llm)

@router.get("/{user_id}", response_model=list[llm_schema.LLMConfigResponse])
def get_user_llms(user_id: int, db: Session = Depends(get_db)):
    return crud_llm.get_llms_by_user(db=db, user_id=user_id)

@router.put("/{user_id}/active/{llm_id}", response_model=llm_schema.LLMConfigResponse)
def set_active(user_id: int, llm_id: int, db: Session = Depends(get_db)):
    updated_llm = crud_llm.set_active_llm(db, user_id, llm_id)
    if not updated_llm:
        raise HTTPException(status_code=404, detail="Không tìm thấy cấu hình LLM")
    return updated_llm

@router.put("/{llm_id}", response_model=llm_schema.LLMConfigResponse)
def update_llm(llm_id: int, llm_update: llm_schema.LLMConfigUpdate, db: Session = Depends(get_db)):
    updated_llm = crud_llm.update_llm_config(db, llm_id, llm_update)
    if not updated_llm:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return updated_llm
@router.delete("/{llm_id}")
def delete_llm(llm_id: int, db: Session = Depends(get_db)):
    deleted = crud_llm.delete_llm_config(db, llm_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="LLM config not found")
    return {"message": "Deleted successfully"}