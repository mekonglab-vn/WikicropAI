import os
import json
import random
import re
from typing import List, Dict, Set, Optional, Any, Tuple
import time
from sentence_transformers import SentenceTransformer
from ai_core.template_manager import ContentTemplate
from ai_core.llm_engine import LLMManager
from sentence_transformers import CrossEncoder
from config_loader import load_chroma_client


class WikiComposer:
    def __init__(self,
                 session_id: str,
                 name: str,
                 template: ContentTemplate,
                 llm: LLMManager,
                 llm_small: Optional[LLMManager] = None,
                 base_dir: str = "data_storage",
                 embedding_model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):

        self.session_id = session_id
        self.name = name
        self.template = template
        self.llm = llm
        self.llm_small = llm_small if llm_small is not None else llm
            
        self.base_dir = base_dir
       
        self.chroma_client, self.collection = load_chroma_client()
        self.embedding_model = SentenceTransformer(embedding_model_name)

        self.full_content: str = ""
        self.array_content: List[Dict] = []
        self.bibliography: str = ""
        self.array_bibliography: List[Dict] = []

        self.reranker = CrossEncoder('itdainb/PhoRanker', max_length=256)
        self.reranker.tokenizer.model_max_length = 256
        self.reranker.max_seq_length = 256

        self.context: str = self._fetch_random_context()[:300]

    def _fetch_random_context(self) -> str:
        try:
            results = self.collection.get(where={"doc_name": self.session_id}, limit=4)
            docs = results.get("documents", [])
            if not docs: return ""
            return "\n...\n".join(docs)
        
        except Exception: return ""

    def _get_relevant_chunks(self, title: str) -> List[Dict]:
        query_vector = self.embedding_model.encode(title).tolist()
        
        initial_k = 10 
        results = self.collection.query(
            query_embeddings=[query_vector],
            n_results=initial_k, 
            where={"doc_name": self.session_id}
        )

        if not results["documents"] or not results["documents"][0]:
            return []

        doc_list = results["documents"][0]
        meta_list = results["metadatas"][0]
        
        rerank_pairs = [[title, doc_text] for doc_text in doc_list]
        
        scores = self.reranker.predict(
            rerank_pairs, 
        )
        ranked_results = []
        for score, doc, meta in zip(scores, doc_list, meta_list):
            ranked_results.append({
                "score": score,
                "content": doc,
                "metadata": meta
            })
            
        ranked_results.sort(key=lambda x: x["score"], reverse=True)
        
        final_top_k = 5
        top_results = ranked_results[:final_top_k]
        
        relevant_data = []
        for item in top_results: 
            
            relevant_data.append({
                "content": item["content"],
                "metadata": item["metadata"]
            })
            
        return relevant_data

    def _is_error_response(self, response: str) -> bool:
        """Check if the response contains error indicators"""
        error_keywords = ["lỗi", "error", "fail", "exception", "không kết nối", "connection failed"]
        return any(keyword.lower() in response.lower() for keyword in error_keywords)

    def _query_expansion(self, title: str, description: str) -> str:
        prompt = f"""
        ### VAI TRÒ:
        Bạn là một chuyên gia tìm kiếm thông tin và tối ưu hóa truy vấn (SEO).
        ### NHIỆM VỤ:
        Hãy viết lại một "câu truy vấn tìm kiếm" (search query) để tìm thông tin cho mục này trong cơ sở dữ liệu.
        
        ### YÊU CẦU:
        1. Câu truy vấn nên gợi ý sâu hơn vào mô tả yêu cầu, có thể bao gồm các từ khóa liên quan, khái niệm chuyên ngành, hoặc cách diễn đạt khác của tiêu đề.
        2. Bổ sung các từ khóa, khái niệm chuyên ngành liên quan có thể xuất hiện trong tài liệu nguồn.
        3. Viết dưới dạng một đoạn văn ngắn hoặc các câu nối tiếp nhau, khoảng 30-50 từ.
        4. CHỈ TRẢ VỀ NỘI DUNG CÂU TRUY VẤN, KHÔNG GIẢI THÍCH.
        5. KHÔNG GHI NGUYÊN BỐI CẢNH VÀO CÂU TRUY VẤN, CHỈ TẬP TRUNG VÀO VIỆC MỞ RỘNG TIÊU ĐỀ VÀ MÔ TẢ YÊU CẦU THÀNH CÂU TRUY VẤN TÌM KIẾM.
        
        ### MỤC CẦN VIẾT:
        - Tiêu đề mục: "{title}"
        - Mô tả yêu cầu: {description}

        ### THÔNG TIN BÀI VIẾT:
        - Tên bài: {self.name}
        - Bối cảnh chung: {self.context}
        """    
        
        wait_count = 0
        max_waits = 3
        _small_fallbacks = ["groq/compound-mini", "meta-llama/llama-4-scout-17b-16e-instruct"]
        fallback_idx = 0

        while True:
            try:
                expanded_query = self.llm_small.send_prompt(prompt[:1500], options={"temperature": 0.5, "max_tokens": 1024})

                if self._is_error_response(expanded_query):
                    print(f"Query Expansion error (error in response): {expanded_query}")
                    if self.llm_small.provider == "OpenAI" and fallback_idx < len(_small_fallbacks):
                        self.llm_small.model_name = _small_fallbacks[fallback_idx]
                        fallback_idx += 1
                        print(f"Switching llm_small model to: {self.llm_small.model_name}")
                        continue
                    if wait_count < max_waits:
                        wait_count += 1
                        print(f"Waiting 60 seconds (attempt {wait_count}/{max_waits})...")
                        time.sleep(60)
                        continue
                    else:
                        print("Query Expansion error - max retries exceeded")
                        return f"{self.name} {title} {description} (Vượt quá số lần thử tối đa)"

                return expanded_query.strip().strip('"').strip("'")[:300]
            except Exception as e:
                print(f"Query Expansion error: {e}")
                if wait_count < max_waits:
                    wait_count += 1
                    time.sleep(10)
                    continue
                else:
                    print("Query Expansion error - max retries exceeded")
                    return f"{self.name} {title} {description}"

    def write_section(self, title: str, description: str) -> Tuple[str, List[Dict]]:
        # Get expanded search query using mini LLM
        search_query = self._query_expansion(title, description)

        chunks = self._get_relevant_chunks(search_query)
        
        if not chunks:
            return "Chưa có thông tin cập nhật cho mục này.", []

        context_str = ""
        raw_sources_meta = []
        for item in chunks:
            context_str += f" {item['content']}"
            raw_sources_meta.append(item['metadata'])

        prompt = f"""
            ### YÊU CẦU:
            1. Tổng hợp thông tin từ dữ liệu tham khảo thành đoạn văn xuôi mượt mà.
            2. Tuyệt đối KHÔNG sử dụng ký tự Markdown (*, #, **, __).
            3. KHÔNG sử dụng dấu xuống dòng (\\n) bên trong đoạn văn.
            4. Nếu dữ liệu không đủ, chỉ viết những gì có chắc chắn.

            ### VAI TRÒ:
            {self.template.system_instruction}

            ### BỐI CẢNH TOÀN BÀI:
            {self.context}

            ### NHIỆM VỤ:
            Viết nội dung cho mục: "{title}".
            Hướng dẫn chi tiết: {description}

            ### DỮ LIỆU THAM KHẢO:
            {context_str}
            """
        
        wait_count = 0
        max_waits = 3
        _main_fallbacks = ["groq/compound", "openai/gpt-oss-120b", "qwen/qwen3-32b"]
        fallback_idx = 0

        while True:
            try:
                response = self.llm.send_prompt(prompt[:4000], options={"temperature": 0.1, "max_tokens": 4000})

                if self._is_error_response(response):
                    print(f"Write section error (error in response): {response}")
                    if self.llm.provider == "OpenAI" and fallback_idx < len(_main_fallbacks):
                        self.llm.model_name = _main_fallbacks[fallback_idx]
                        fallback_idx += 1
                        print(f"Switching llm model to: {self.llm.model_name}")
                        continue
                    if wait_count < max_waits:
                        wait_count += 1
                        print(f"Waiting 60 seconds (attempt {wait_count}/{max_waits})...")
                        time.sleep(60)
                        continue
                    else:
                        print("Write section error - max retries exceeded")
                        raise Exception("Write section error - LLM failed (quá số lượng token cho phép)")

                clean_text = response.strip()
                clean_text = re.sub(r'[\*\#\_]', '', clean_text)
                clean_text = re.sub(r'\s+', ' ', clean_text)

                return clean_text, raw_sources_meta
            except Exception as e:
                print(f"Write section error: {e}")
                if wait_count < max_waits:
                    wait_count += 1
                    time.sleep(60)
                    continue
                else:
                    print("LLM error in writing content - max retries exceeded")
                    raise Exception("LLM error in writing content - max retries exceeded")
  

    def _dfs_traverse(self, node: Dict) -> Dict:
        
        title = node.get("title", "Mục không tên")

        result_node = {
            "title": title,
            "type": "section",
            "content": "",
            "source": [],
            "children": []
        }

        if "subsections" in node and isinstance(node["subsections"], list) and len(node["subsections"]) > 0:
            full_text_children = ""
            for child in node["subsections"]:
                child_result = self._dfs_traverse(child)
                result_node["children"].append(child_result)
                if child_result["content"]:
                    full_text_children += f"\n{child_result['title']}\n{child_result['content']}\n"
            result_node["content"] = full_text_children
        
        elif "description" in node:
            content, raw_sources_meta = self.write_section(title, node["description"])
    
            source_stts = []
            
            registry = {}

            for meta in raw_sources_meta:
                sid = str(meta.get("source_id"))
                current_locator_obj = meta 
                real_name = registry.get(sid, self.session_id)

                found_id = None
                for bib in self.array_bibliography:
                    if bib["name"] == real_name and bib["locator"] == current_locator_obj:
                        found_id = bib["id"]
                        break
                
                if found_id is None:
                    found_id = len(self.array_bibliography) + 1
                    self.array_bibliography.append({
                        "id": found_id,
                        "name": real_name,
                        "locator": current_locator_obj
                    })
                
                if found_id not in source_stts:
                    source_stts.append(found_id)

            result_node["content"] = content
            result_node["source"] = source_stts
            result_node["type"] = "leaf"
        
        else:
            result_node["content"] = ""

        return result_node

    def write_bibliography(self):
    
        self.bibliography = "## TÀI LIỆU THAM KHẢO\n"
        bib_lines = []
        for bib in self.array_bibliography:
            loc = bib['locator']
            loc_str = f"Block: {loc.get('block_index')}" if 'block_index' in loc else str(loc)
            bib_lines.append(f"[{bib['id']}] {bib['name']} ({loc_str})")
        
        if not bib_lines:
            self.bibliography += "Chưa có tài liệu tham khảo."
        else:
            self.bibliography += "\n".join(bib_lines)

    def wiki_compose(self):
        print(f"Writing article: {self.name}")
        self.full_content = f"# {self.name}\n\n"
        
        for node in self.template.structure:
            processed_node = self._dfs_traverse(node)
            self.array_content.append(processed_node)
            self.full_content += f"{processed_node['title']}\n{processed_node['content']}\n\n"

        self.write_bibliography()
        self.full_content += f"\n{self.bibliography}"
        
        print("Completed")
        return {
            "full_content": self.full_content,
            "array_content": self.array_content,
            "array_bibliography": self.array_bibliography
        }