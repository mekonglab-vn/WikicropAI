import configparser
import os
import chromadb
from ai_core.llm_engine import LLMManager

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.txt")


def _get_config() -> configparser.ConfigParser:
    cfg = configparser.ConfigParser()
    cfg.read(_CONFIG_PATH, encoding="utf-8")
    return cfg


def load_chroma_client():
    cfg = _get_config()
    section = cfg["CHROMADB"]
    chroma_type = section.get("type", "cloud").lower()
    collection_name = section.get("collection", "wiki_docs")

    if chroma_type == "local":
        path = section.get("path", "./chroma_data")
        client = chromadb.PersistentClient(path=path)
    else:
        client = chromadb.CloudClient(
            api_key=section["api_key"],
            tenant=section["tenant"],
            database=section["database"]
        )

    collection = client.get_or_create_collection(name=collection_name)
    return client, collection


def load_llm() -> LLMManager:
    cfg = _get_config()
    s = cfg["LLM"]
    return LLMManager(
        provider=s["provider"],
        base_url=s["base_url"],
        api_key=s["api_key"],
        model_name=s["model_name"]
    )


def load_llm_small() -> LLMManager:
    cfg = _get_config()
    if "LLM_SMALL" not in cfg:
        return load_llm()
    s = cfg["LLM_SMALL"]
    return LLMManager(
        provider=s["provider"],
        base_url=s["base_url"],
        api_key=s["api_key"],
        model_name=s["model_name"]
    )

def load_admin_account():
    cfg = _get_config()
    if "ADMIN" not in cfg:
        return None
    s = cfg["ADMIN"]
    return {
        "username": s["username"],
        "password": s["password"]
    }