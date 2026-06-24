import os
import json
import uuid
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
from ai_core.extractor import Extractor
from config_loader import load_chroma_client

class Preprocessor:
    def __init__(self, extract_model_size="base", embedding_model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", chunk_size=600, chunk_overlap=100):
        self.extractor = Extractor(model_size=extract_model_size)
        self.embedding_model = SentenceTransformer(embedding_model_name)

        self.chroma_client, self.collection = load_chroma_client()
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", "! ", "? ", " ", ""]
        )

    def extract(self, input_source, input_type, file_content: bytes = None):
        extracted_data = []
        
        if input_type == "url": 
            extracted_data = self.extractor.extract_website(input_source)
        elif input_type in ["pdf", "docx"]: 
            ext = ".pdf" if input_type == "pdf" else ".docx"
            extracted_data = self.extractor.extract_text_file(file_content, ext)
        elif input_type == "youtube": 
            extracted_data = self.extractor.extract_youtube(input_source) 
        elif input_type == "audio" or input_type == "video": 
            extracted_data = self.extractor.extract_audio_content(file_content)
        elif input_type == "txt":
            extracted_data = self.extractor.extract_txt_content(file_content)

        return extracted_data

    
    def chunking(self, extracted_data):
        final_chunks = []
        
        for item in extracted_data:
            text = item.get("text", "")
            meta = item.get("metadata", {})
            
            if len(text) > self.text_splitter._chunk_size:
                sub_chunks = self.text_splitter.split_text(text)
                for sub in sub_chunks:
                    final_chunks.append({"text": sub, "metadata": meta})
            else:
                final_chunks.append({"text": text, "metadata": meta})
                
        return final_chunks

    def save_to_vector_db(self, chunks, session_id, source_id):
        ids = []
        documents = []
        metadatas = []
        
        raw_data_to_return = []
        
        for i, chunk in enumerate(chunks):
            
            chunk_uuid = str(uuid.uuid4())
            
            ids.append(chunk_uuid)
            documents.append(chunk["text"])
            
            meta = {
                "doc_name": session_id, 
                "source_id": source_id,
                "chunk_index": chunk_uuid 
            }
            
            source_meta = chunk.get("metadata", {})
            meta["source_type"] = source_meta.get("source_type", "unknown")
            locator = source_meta.get("locator", {})
            meta.update(locator)
            
            metadatas.append(meta)

            raw_data_to_return.append({
                "chunk_index": chunk_uuid, 
                "content": chunk["text"],
                "meta_data": meta 
            })

        embeddings = self.embedding_model.encode(documents).tolist()
        
        batch_size = 250
        
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i : i + batch_size]
            batch_docs = documents[i : i + batch_size]
            batch_embeds = embeddings[i : i + batch_size]
            batch_metas = metadatas[i : i + batch_size]
            
            self.collection.add(
                documents=batch_docs, 
                embeddings=batch_embeds, 
                metadatas=batch_metas, 
                ids=batch_ids
            )
        
        
        return raw_data_to_return

    def execute(self, session_id, source_id, input_source, input_type, file_content: bytes = None):
        data = self.extract(input_source, input_type, file_content)
        
        if not data:
            raise ValueError(f"Cannot extract data from: {input_source}")
            
        chunks = self.chunking(data)
        
        raw_chunks = self.save_to_vector_db(chunks, session_id, source_id)
        
        return raw_chunks