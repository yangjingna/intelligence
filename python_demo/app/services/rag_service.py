# -*- coding: utf-8 -*-
import uuid
from typing import List, Optional, Tuple
from datetime import datetime
from ..core.config import settings
from ..core.chromadb_client import chromadb_client
from .embedding_service import embedding_service


class RAGService:
    """RAG 检索增强生成服务"""

    def __init__(self):
        self.top_k = settings.RAG_TOP_K
        self.similarity_threshold = settings.RAG_SIMILARITY_THRESHOLD

    async def index_message_pair(
        self,
        question: str,
        answer: str,
        job_id: Optional[int] = None,
        hr_id: Optional[int] = None,
        conversation_id: Optional[int] = None
    ) -> bool:
        """索引问答对到知识库"""
        try:
            # 组合问答对作为文档
            document = f"问题：{question}\n回答：{answer}"

            # 获取向量
            embedding = await embedding_service.get_embedding(document)
            if not embedding:
                print("Failed to get embedding for document")
                return False

            # 生成唯一 ID
            doc_id = str(uuid.uuid4())

            # 构建元数据
            metadata = {
                "question": question,
                "answer": answer,
                "created_at": datetime.utcnow().isoformat()
            }
            if job_id:
                metadata["job_id"] = job_id
            if hr_id:
                metadata["hr_id"] = hr_id
            if conversation_id:
                metadata["conversation_id"] = conversation_id

            # 添加到 ChromaDB
            chromadb_client.add_documents(
                documents=[document],
                embeddings=[embedding],
                metadatas=[metadata],
                ids=[doc_id]
            )
            return True
        except Exception as e:
            print(f"RAG index error: {e}")
            return False

    async def search_similar(
        self,
        query: str,
        job_id: Optional[int] = None,
        n_results: Optional[int] = None
    ) -> List[Tuple[str, str, float]]:
        """检索相似历史问答

        Returns:
            List of (question, answer, similarity_score) tuples
        """
        try:
            # 获取查询向量
            query_embedding = await embedding_service.get_embedding(query)
            if not query_embedding:
                return []

            # 构建过滤条件
            where = None
            if job_id:
                where = {"job_id": job_id}

            # 查询 ChromaDB
            results = chromadb_client.query(
                query_embedding=query_embedding,
                n_results=n_results or self.top_k,
                where=where
            )

            # 处理结果
            similar_pairs = []
            if results and results.get("metadatas"):
                metadatas = results["metadatas"][0]
                distances = results["distances"][0] if results.get("distances") else []

                for i, metadata in enumerate(metadatas):
                    # ChromaDB 返回的是距离，转换为相似度
                    distance = distances[i] if i < len(distances) else 1.0
                    similarity = 1 - distance  # L2 距离转相似度

                    if similarity >= self.similarity_threshold:
                        similar_pairs.append((
                            metadata.get("question", ""),
                            metadata.get("answer", ""),
                            similarity
                        ))

            return similar_pairs
        except Exception as e:
            print(f"RAG search error: {e}")
            return []

    async def build_rag_context(
        self,
        query: str,
        job_id: Optional[int] = None,
        max_pairs: int = 3
    ) -> str:
        """构建 RAG 上下文"""
        similar_pairs = await self.search_similar(query, job_id, n_results=max_pairs)

        if not similar_pairs:
            return ""

        context_parts = ["以下是相关的历史问答供参考："]
        for i, (question, answer, score) in enumerate(similar_pairs, 1):
            context_parts.append(f"\n参考{i}：")
            context_parts.append(f"问：{question}")
            context_parts.append(f"答：{answer}")

        return "\n".join(context_parts)

    async def sync_conversation_to_knowledge(
        self,
        messages: List[dict],
        job_id: Optional[int] = None,
        hr_id: Optional[int] = None,
        conversation_id: Optional[int] = None
    ) -> int:
        """同步会话到知识库

        将会话中的问答对提取并索引到知识库
        Returns:
            成功索引的问答对数量
        """
        indexed_count = 0
        pending_question = None

        for msg in messages:
            sender_id = msg.get("sender_id")
            content = msg.get("content", "")
            msg_type = msg.get("type", "")

            # 跳过 AI 回复，只索引 HR 的真实回复
            if msg_type == "ai_response":
                continue

            # 如果发送者是 HR（与 hr_id 匹配），则是回答
            if hr_id and sender_id == hr_id:
                if pending_question:
                    # 有待处理的问题，形成问答对
                    success = await self.index_message_pair(
                        question=pending_question,
                        answer=content,
                        job_id=job_id,
                        hr_id=hr_id,
                        conversation_id=conversation_id
                    )
                    if success:
                        indexed_count += 1
                    pending_question = None
            else:
                # 学生的消息作为问题
                pending_question = content

        return indexed_count


# 单例实例
rag_service = RAGService()
