from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Lớp cơ sở chứa các trường chung
class LLMConfigBase(BaseModel):
    provider: str
    base_url: Optional[str] = None
    api_key: str
    model_name: str

# Lớp dùng khi tạo mới (nhận từ Frontend)
class LLMConfigCreate(LLMConfigBase):
    user_id: int

class LLMConfigUpdate(BaseModel):
    provider: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    model_name: Optional[str] = None

# Lớp dùng để trả kết quả về (Response)
class LLMConfigResponse(LLMConfigBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True 