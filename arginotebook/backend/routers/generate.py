from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from databases.connection import get_db
from schemas import content_schema
from services import ai_generation

router = APIRouter(prefix="/api/v1/ai", tags=["AI Process (Extract & Generate)"])

# --- API 1: TRÍCH XUẤT DỮ LIỆU (EXTRACT) ---
@router.post("/extract/file/{notebook_id}")
async def extract_source_file(
    notebook_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):

    filename = file.filename
    ext = filename.split(".")[-1].lower()
    
    # Kiểm tra định dạng hỗ trợ
    if ext not in ["pdf", "docx", "txt", "mp3", "mp4"]:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    file_type_list = {
        "pdf": "pdf",
        "docx": "docx",
        "txt": "txt",
        "mp3": "audio",
        "mp4": "video"
    }
    my_file_type = file_type_list.get(ext)
    # Đọc nội dung file dạng bytes
    content = await file.read()
    
    try:
        source = ai_generation.extract_and_save_source_file(
            db=db,
            notebook_id=notebook_id,
            file_content=content,
            file_type=my_file_type,
            filename=filename
        )
        return {
            "status": "success", 
            "message": f"Processed: {filename}",
            "source_id": source.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất: {str(e)}")

@router.post("/extract/url/{notebook_id}")
def extract_source_url(
    notebook_id: int, 
    url: str, 
    db: Session = Depends(get_db)
):
    type = "youtube" if "youtube.com" in url else "url"

    try:
        if type == "youtube":
            source = ai_generation.extract_and_save_youtube(db, notebook_id, url)
        else:
            source = ai_generation.extract_and_save_url(db, notebook_id, url)
        return {
            "status": "success", 
            "message": f"Processed: {url}",
            "source_id": source.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi trích xuất: {str(e)}")



# --- API 2: SINH BÀI VIẾT (GENERATE) ---
class GenerateReq(BaseModel):
    user_id: int
    template_id: int
    topic_name: str

@router.post("/generate/{notebook_id}", response_model=content_schema.ArticleResponse)
def start_generation(
    notebook_id: int, 
    req: GenerateReq, 
    db: Session = Depends(get_db)
):
    try:
        article = ai_generation.generate_article_logic(
            db=db,
            user_id=req.user_id,
            notebook_id=notebook_id,
            template_id=req.template_id,
            topic_name=req.topic_name
        )
        return article
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI system error: {str(e)}")


from typing import List, Dict

class WikiUploadReq(BaseModel):
    name: str
    array_content: List[Dict[str, str]]
    array_bibliography: List[str]
    array_sources: List[str]

# API 3: Upload bài
@router.post("/wiki/upload")
def upload_wiki_article(req: WikiUploadReq):
    try:
        article_data = req.model_dump()
        success = ai_generation.upload_article_to_wiki(article_data)
        
        if success:
            return {"status": "success", "message": f"Article '{req.name}' uploaded to Draft", "url": f"http://localhost/wiki/{req.name.replace(' ', '_')}"}
        else:
            raise HTTPException(status_code=500, detail="Wiki upload failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# API 4: Tạo mindmap
@router.post("/mindmap/generate/{notebook_id}")
def generate_mindmap(notebook_id: int, db: Session = Depends(get_db)):
    try:
        mindmap_url = ai_generation.generate_mindmap_logic(db, notebook_id)
        return {"status": "success", "mindmap_url": mindmap_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))