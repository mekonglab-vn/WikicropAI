from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from databases.connection import Base

class LLMConfig(Base):
    __tablename__ = "llm_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # Lưu ID từ MediaWiki
    provider = Column(String(50))
    base_url = Column(String(255), nullable=True)
    api_key = Column(String(255))
    model_name = Column(String(100))
    is_active = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Notebook(Base):
    __tablename__ = "notebooks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True) # Lưu ID từ MediaWiki
    name = Column(String(255), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Quan hệ (Relationships) để dễ dàng truy vấn
    sources = relationship("Source", back_populates="notebook", cascade="all, delete-orphan")
    articles = relationship("Article", back_populates="notebook", cascade="all, delete-orphan")

class Source(Base):
    __tablename__ = "sources"
    
    id = Column(Integer, primary_key=True, index=True)
    notebook_id = Column(Integer, ForeignKey("notebooks.id"))
    title = Column(String(255))
    type = Column(String(50)) # web, pdf, youtube...
    url_or_path = Column(String(500))
    status = Column(String(50), default="processing")
    
    notebook = relationship("Notebook", back_populates="sources")
    chunks = relationship("SourceChunk", back_populates="source", cascade="all, delete-orphan")

class SourceChunk(Base):
    __tablename__ = "source_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"))
    chunk_index = Column(String(255))
    content = Column(Text)
    meta_data = Column(JSON) # Đổi tên thành meta_data để tránh trùng keyword metadata của SQLAlchemy
    
    source = relationship("Source", back_populates="chunks")
    citations = relationship("Citation", back_populates="chunk")

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    name = Column(String(255))
    prompt_structure = Column(JSON)
    status = Column(Integer, default=1) # 1: active, 0: inactive
    
    articles = relationship("Article", back_populates="template")

class Article(Base):
    __tablename__ = "articles"
    
    id = Column(Integer, primary_key=True, index=True)
    notebook_id = Column(Integer, ForeignKey("notebooks.id"))
    template_id = Column(Integer, ForeignKey("templates.id"))
    final_content = Column(JSON)
    bibliography = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    notebook = relationship("Notebook", back_populates="articles")
    template = relationship("Template", back_populates="articles")
    citations = relationship("Citation", back_populates="article", cascade="all, delete-orphan")

class Citation(Base):
    __tablename__ = "citations"
    
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"))
    chunk_id = Column(Integer, ForeignKey("source_chunks.id"))
    citation_marker = Column(String(50)) # Ví dụ: "[1]"
    
    article = relationship("Article", back_populates="citations")
    chunk = relationship("SourceChunk", back_populates="citations")

class Mindmap(Base):
    __tablename__ = "mindmap"
    
    id = Column(Integer, primary_key=True, index=True)
    notebook_id = Column(Integer)
    structure = Column(JSON) 
    