from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# ==========================================
# 1. SOURCE CHUNK (Dữ liệu thô)
# ==========================================

class SourceChunkBase(BaseModel):
    chunk_index: str
    content: str
    meta_data: dict # Pydantic dùng dict để map với JSON của SQLAlchemy

class SourceChunkCreate(SourceChunkBase):
    source_id: int

class SourceChunkResponse(SourceChunkBase):
    id: int
    source_id: int
    class Config: from_attributes = True

# Schema cho Source Chunk
class SourceChunkResponse(BaseModel):
    id: int
    source_id: int
    chunk_index: str
    content: str
    meta_data: Optional[Any] = None

    class Config:
        from_attributes = True # Dùng orm_mode = True nếu bạn dùng Pydantic v1

# Schema cho Source
class SourceResponse(BaseModel):
    id: int
    notebook_id: int
    title: str
    type: str
    url_or_path: str
    status: str

    class Config:
        from_attributes = True

# ==========================================
# 2. TEMPLATE (Khuôn mẫu)
# ==========================================
class TemplateBase(BaseModel):
    name: str
    prompt_structure: List[dict]


class TemplateCreate(BaseModel):
    name: str
    prompt_structure: list
    user_id: int 

class TemplateResponse(BaseModel):
    id: int
    name: str
    prompt_structure: list
    user_id: int
    status: int

    class Config:
        from_attributes = True

# ==========================================
# 3. CITATION (Tham chiếu)
# ==========================================
class CitationBase(BaseModel):
    citation_marker: str

class CitationCreate(CitationBase):
    article_id: int
    chunk_id: int

class CitationResponse(CitationBase):
    id: int
    article_id: int
    chunk_id: int
    # Tuyệt chiêu: Kéo luôn dữ liệu chunk lên để hiển thị Pop-up ở Frontend
    chunk: Optional[SourceChunkResponse] = None 
    class Config: from_attributes = True

# ==========================================
# 4. ARTICLE (Bài viết)
# ==========================================
class ArticleBase(BaseModel):
    final_content: Optional[Any] = None 
    bibliography: Optional[Any] = None


class ArticleCreate(BaseModel):
    notebook_id: int
    template_id: Optional[int] = None
    final_content: Optional[Any] = None 
    bibliography: Optional[Any] = None

class ArticleUpdate(BaseModel):
    final_content: Optional[Any] = None
    bibliography: Optional[Any] = None

class ArticleResponse(BaseModel):
    id: int
    notebook_id: int
    template_id: Optional[int]
    final_content: Optional[Any]
    bibliography: Optional[Any]
    created_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# 5. MINDMAP (Sơ đồ tư duy)
# ==========================================
class MindmapBase(BaseModel):
    structure: Optional[Any] = None

class MindmapCreate(MindmapBase):
    notebook_id: int

class MindmapUpdate(MindmapBase):
    structure: Optional[Any] = None

class MindmapResponse(MindmapBase):
    id: int
    notebook_id: int

    class Config:
        from_attributes = True