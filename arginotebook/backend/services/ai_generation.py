import json
from urllib import response
from sqlalchemy.orm import Session
from databases import models, crud_content, crud_notebook
from schemas import content_schema, notebook_schema
from ai_core.llm_engine import LLMManager
from ai_core.wiki_composer import WikiComposer
from ai_core.preprocessor import Preprocessor
from ai_core.template_manager import ContentTemplate
from config_loader import load_llm, load_llm_small, load_admin_account


def extract_and_save_url(db: Session, notebook_id: int, url: str):
    source_in = notebook_schema.SourceCreate(
        title=url,
        type="url",
        url_or_path=url,
        notebook_id=notebook_id,
        status="processing"
    )
    db_source = crud_notebook.create_source(db, source_in)

    try:
        session_id = f"nb_{notebook_id}"
        preprocessor = Preprocessor()
        
        raw_chunks = preprocessor.execute(
            session_id=session_id,
            source_id=db_source.id,
            input_source=url,
            input_type="url"
        )

        for chunk in raw_chunks:
            chunk_in = content_schema.SourceChunkCreate(
                source_id=db_source.id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                meta_data=chunk["meta_data"]
            )
            crud_content.create_chunk(db, chunk_in)

        crud_notebook.update_source_status(db, db_source.id, "completed")
        return db_source

    except Exception as e:
        crud_notebook.update_source_status(db, db_source.id, "failed")
        raise e

def extract_and_save_youtube(db: Session, notebook_id: int, url: str):
    source_in = notebook_schema.SourceCreate(
        title=url,
        type="youtube",
        url_or_path=url,
        notebook_id=notebook_id,
        status="processing"
    )
    db_source = crud_notebook.create_source(db, source_in)

    try:
        session_id = f"nb_{notebook_id}"
        preprocessor = Preprocessor()
        
        raw_chunks = preprocessor.execute(
            session_id=session_id,
            source_id=db_source.id,
            input_source=url,
            input_type="youtube"
        )

        for chunk in raw_chunks:
            chunk_in = content_schema.SourceChunkCreate(
                source_id=db_source.id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                meta_data=chunk["meta_data"]
            )
            crud_content.create_chunk(db, chunk_in)

        crud_notebook.update_source_status(db, db_source.id, "completed")
        return db_source

    except Exception as e:
        crud_notebook.update_source_status(db, db_source.id, "failed")
        raise e

def extract_and_save_source_file(db: Session, notebook_id: int, file_content: bytes, file_type: str, filename: str):
    source_in = notebook_schema.SourceCreate(
        title=filename,
        type=file_type,
        url_or_path=filename,
        notebook_id=notebook_id,
        status="processing"
    )
    db_source = crud_notebook.create_source(db, source_in)

    try:
        session_id = f"nb_{notebook_id}"
        preprocessor = Preprocessor()
        
        raw_chunks = preprocessor.execute(
            session_id=session_id,
            source_id=db_source.id,
            input_source=filename,
            input_type=file_type,
            file_content=file_content
        )

        for chunk in raw_chunks:
            chunk_in = content_schema.SourceChunkCreate(
                source_id=db_source.id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                meta_data=chunk["meta_data"]
            )
            crud_content.create_chunk(db, chunk_in)

        crud_notebook.update_source_status(db, db_source.id, "completed")
        return db_source

    except Exception as e:
        crud_notebook.update_source_status(db, db_source.id, "failed")
        raise e

def generate_article_logic(db: Session, user_id: int, notebook_id: int, template_id: int, topic_name: str):
    
    my_llm = load_llm()
    my_mini_llm = load_llm_small()

    db_template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if not db_template:
        raise ValueError(f"Template not found with ID = {template_id}")

    structure_data = db_template.prompt_structure 

    my_template = ContentTemplate(
        name=db_template.name,
        description=db_template.name,
        system_instruction="Bạn là một chuyên gia nông nghiệp...",
        structure=structure_data 
    )

    session_id = f"nb_{notebook_id}"
    my_composer = WikiComposer(session_id=session_id, name=topic_name, template=my_template, llm=my_llm, llm_small=my_mini_llm)
    
    output = my_composer.wiki_compose()
    article_in = content_schema.ArticleCreate(
        final_content={
            "full_content": output.get("full_content", ""),
            "array_content": output.get("array_content", [])
        },
        bibliography=output.get("array_bibliography", []),
        notebook_id=notebook_id,
        template_id=template_id
    )
    db_article = crud_content.create_article(db, article_in)

    for bib in output.get("array_bibliography", []):
        locator = bib.get("locator", {})
        
        if "source_id" in locator and "chunk_index" in locator:
            db_chunk = db.query(models.SourceChunk).filter(
                models.SourceChunk.source_id == locator["source_id"],
                models.SourceChunk.chunk_index == locator["chunk_index"]
            ).first()

            if db_chunk:
                citation_in = content_schema.CitationCreate(
                    article_id=db_article.id,
                    chunk_id=db_chunk.id,
                    citation_marker=f"[{bib.get('id', '')}]"
                )
                crud_content.create_citation(db, citation_in)

    return db_article

import requests

def upload_article_to_wiki(article_json):
    WIKI_API_URL = "http://localhost/wikicrop/api.php"

    admin_account = load_admin_account()
    if not admin_account:
        return {"status": "error", "message": "Admin account not configured"} 

    USERNAME = admin_account["username"]
    PASSWORD = admin_account["password"]

    name = article_json.get('name', 'Trang_moi')
    title = f"Draft:{name}"

    content = ""
    for section in article_json.get('array_content', []):
        content += f"== {section['title']} ==\n{section['content']}\n\n"

    if article_json.get('array_sources'):
        content += "== Nguồn tài liệu ==\n"
        for src in article_json['array_sources']:
            content += f"* {src}\n"
        content += "\n"

    if article_json.get('array_bibliography'):
        content += "== Danh mục tham khảo ==\n"
        for bib in article_json['array_bibliography']:
            content += f"* {bib}\n"
        content += "\n"

    content += "[[Thể loại:Đang chờ duyệt]]"

    session = requests.Session()
    try:
        params_token = {"action": "query", "meta": "tokens", "type": "login", "format": "json"}
        res_token = session.get(url=WIKI_API_URL, params=params_token).json()
        login_token = res_token['query']['tokens']['logintoken']

        params_login = {
            "action": "login",
            "lgname": USERNAME,
            "lgpassword": PASSWORD,
            "lgtoken": login_token,
            "format": "json"
        }
        session.post(WIKI_API_URL, data=params_login)

        params_csrf = {"action": "query", "meta": "tokens", "format": "json"}
        res_csrf = session.get(url=WIKI_API_URL, params=params_csrf).json()
        csrf_token = res_csrf['query']['tokens']['csrftoken']

        params_edit = {
            "action": "edit",
            "title": title,
            "text": content,
            "summary": "Đăng bài viết mới",
            "token": csrf_token,
            "format": "json"
        }
        
        response = session.post(WIKI_API_URL, data=params_edit).json()

        if "error" in response:
            error_msg = response["error"].get("info", "Unknown API error")
            print(f"Post error: {response}")
            return {"status": "error", "message": f"Wiki Error: {error_msg}"}

        if "edit" in response and response["edit"]["result"] == "Success":
            print(f"Posted: {title}")
            return {
                "status": "success", 
                "message": f"Article '{title}' uploaded", 
                "url": f"http://localhost/wikicrop/index.php/{title}"
            }
        
        return {"status": "error", "message": "Unexpected response from Wiki"}
    except Exception as e:
        print(f"API connection error: {e}")
        return {"status": "error", "message": "API connection error"}


from fastapi import HTTPException
def generate_mindmap_logic(db: Session, notebook_id: int):
    article_data = crud_content.get_articles_by_notebook(db, notebook_id)
    notebook = crud_notebook.get_notebook_by_id(db, notebook_id)
    

    if not notebook:
        raise HTTPException(status_code=404, detail="Notebook không tồn tại")
    
    if not article_data or not article_data[0].final_content or len(article_data) == 0:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết để tạo Mindmap")
    
    
    article = article_data[0].final_content.get("array_content", [])
    
    notebook_name = notebook.name

    my_mini_llm = load_llm()

    mindmap_children = []

    for section in article:
        section_title = section.get("title", "Mục không tên")
        section_content = section.get("content", "")

        if not section_content:
            continue

        prompt = f"""
        ### NHIỆM VỤ:
        Tách đoạn văn dưới đây thành tối đa 4 mệnh đề ngắn gọn, súc tích để làm mindmap.

        ### YÊU CẦU:
        1. Mỗi mệnh đề phải là một ý hoàn chỉnh, không quá 50 từ.
        2. Chắt lọc những thông tin quan trọng nhất.
        3. TRẢ VỀ DƯỚI DẠNG DANH SÁCH, MỖI DÒNG MỘT MỆNH ĐỀ.
        4. KHÔNG TRẢ VỀ BẤT KỲ LỜI GIẢI THÍCH NÀO.

        ### ĐOẠN VĂN:
        {section_content}
        """

        try:
            response = my_mini_llm.send_prompt(prompt[:11999], options={"temperature": 0.1})
            if "error" in response.lower() or not response.strip():
                raise HTTPException(status_code=503, detail="Hệ thống AI quá tải (Out of tokens)")
            lines = response.strip().split('\n')
            propositions = [{"title": line.strip("- ").strip().replace("*", "")} for line in lines if line.strip()]
        except HTTPException:
            raise
        except Exception as e:
            print(f"Lỗi khi gọi LLM: {str(e)}")
            raise HTTPException(status_code=503, detail="Hệ thống AI quá tải (Out of tokens)")

        mindmap_children.append({
            "title": section_title,
            "children": propositions
        })

    new_mindmap = content_schema.MindmapCreate(
        structure={
            "title": notebook_name,
            "children": mindmap_children
        },
        notebook_id=notebook_id
    )
    db_mindmap = crud_content.create_mindmap(db, new_mindmap)
    
    return {
        "title": notebook_name,
        "children": mindmap_children
    }