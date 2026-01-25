# -*- coding: utf-8 -*-
import chromadb
from chromadb.config import Settings
from .config import settings


class ChromaDBClient:
    """ChromaDB 客户端单例"""
    _instance = None
    _client = None
    _collection = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            self._client = chromadb.PersistentClient(
                path=settings.CHROMADB_PATH,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            self._collection = self._client.get_or_create_collection(
                name="chat_knowledge_base",
                metadata={"description": "HR 问答知识库"}
            )

    @property
    def client(self):
        return self._client

    @property
    def collection(self):
        return self._collection

    def add_documents(
        self,
        documents: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict],
        ids: list[str]
    ):
        """添加文档到集合"""
        self._collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def query(
        self,
        query_embedding: list[float],
        n_results: int = 5,
        where: dict = None
    ) -> dict:
        """查询相似文档"""
        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"]
        }
        if where:
            kwargs["where"] = where
        return self._collection.query(**kwargs)

    def delete_by_conversation(self, conversation_id: int):
        """删除指定会话的所有文档"""
        self._collection.delete(
            where={"conversation_id": conversation_id}
        )


# 单例实例
chromadb_client = ChromaDBClient()
