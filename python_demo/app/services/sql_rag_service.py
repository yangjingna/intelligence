# -*- coding: utf-8 -*-
"""
基于 SQL 的 RAG 服务
使用 MySQL 存储长期记忆（知识库）
"""
import numpy as np
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import SessionLocal
from ..models.knowledge import KnowledgeBase, ChatMemory
from .embedding_service import embedding_service


class SQLRAGService:
    """基于 SQL 的 RAG 检索服务"""

    def __init__(self):
        self.similarity_threshold = 0.7
        self.top_k = 5

    def _get_db(self) -> Session:
        """获取数据库会话"""
        return SessionLocal()

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """计算余弦相似度"""
        if not vec1 or not vec2:
            return 0.0

        a = np.array(vec1)
        b = np.array(vec2)

        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)

        if norm_a == 0 or norm_b == 0:
            return 0.0

        return dot_product / (norm_a * norm_b)

    async def index_qa_pair(
        self,
        question: str,
        answer: str,
        job_id: Optional[int] = None,
        hr_id: Optional[int] = None,
        conversation_id: Optional[int] = None,
        category: Optional[str] = None
    ) -> bool:
        """索引问答对到知识库

        Args:
            question: 用户问题
            answer: HR回答
            job_id: 岗位ID
            hr_id: HR用户ID
            conversation_id: 会话ID
            category: 问题分类

        Returns:
            是否成功
        """
        try:
            # 生成问题的向量嵌入
            embedding = await embedding_service.get_embedding(question)

            db = self._get_db()
            try:
                # 检查是否存在相似问题（避免重复）
                if embedding:
                    similar = await self._find_similar_in_db(db, embedding, job_id, threshold=0.95)
                    if similar:
                        # 更新已有记录的答案
                        existing = db.query(KnowledgeBase).filter(
                            KnowledgeBase.id == similar[0][0]
                        ).first()
                        if existing:
                            existing.answer = answer
                            existing.updated_at = datetime.utcnow()
                            db.commit()
                            print(f"Updated existing knowledge: id={existing.id}")
                            return True

                # 创建新记录
                knowledge = KnowledgeBase(
                    question=question,
                    answer=answer,
                    embedding=embedding,
                    job_id=job_id,
                    hr_id=hr_id,
                    conversation_id=conversation_id,
                    category=category
                )
                db.add(knowledge)
                db.commit()
                print(f"Indexed new knowledge: job_id={job_id}, question={question[:50]}...")
                return True
            finally:
                db.close()

        except Exception as e:
            print(f"SQL RAG index error: {e}")
            return False

    async def _find_similar_in_db(
        self,
        db: Session,
        query_embedding: List[float],
        job_id: Optional[int] = None,
        threshold: float = 0.7
    ) -> List[Tuple[int, float]]:
        """在数据库中查找相似记录

        Returns:
            List of (id, similarity_score)
        """
        # 构建查询
        query = db.query(KnowledgeBase)
        if job_id:
            query = query.filter(KnowledgeBase.job_id == job_id)

        records = query.all()

        # 计算相似度
        similar = []
        for record in records:
            if record.embedding:
                similarity = self._cosine_similarity(query_embedding, record.embedding)
                if similarity >= threshold:
                    similar.append((record.id, similarity))

        # 按相似度排序
        similar.sort(key=lambda x: x[1], reverse=True)
        return similar

    async def search_similar(
        self,
        query: str,
        job_id: Optional[int] = None,
        n_results: Optional[int] = None
    ) -> List[Tuple[str, str, float]]:
        """检索相似历史问答

        Args:
            query: 查询文本
            job_id: 岗位ID（可选，用于精确匹配）
            n_results: 返回结果数量

        Returns:
            List of (question, answer, similarity_score)
        """
        try:
            # 生成查询向量
            query_embedding = await embedding_service.get_embedding(query)
            if not query_embedding:
                return []

            db = self._get_db()
            try:
                # 构建查询
                base_query = db.query(KnowledgeBase)

                # 如果指定了 job_id，先查找该岗位的知识
                results = []

                if job_id:
                    job_records = base_query.filter(KnowledgeBase.job_id == job_id).all()
                    for record in job_records:
                        if record.embedding:
                            similarity = self._cosine_similarity(query_embedding, record.embedding)
                            if similarity >= self.similarity_threshold:
                                results.append((record, similarity))

                # 如果岗位知识不足，补充通用知识
                if len(results) < (n_results or self.top_k):
                    general_records = base_query.filter(
                        KnowledgeBase.job_id == None
                    ).all()
                    for record in general_records:
                        if record.embedding:
                            similarity = self._cosine_similarity(query_embedding, record.embedding)
                            if similarity >= self.similarity_threshold:
                                results.append((record, similarity))

                # 去重并排序
                seen_ids = set()
                unique_results = []
                for record, sim in results:
                    if record.id not in seen_ids:
                        seen_ids.add(record.id)
                        unique_results.append((record, sim))

                unique_results.sort(key=lambda x: x[1], reverse=True)

                # 更新命中次数
                top_results = unique_results[:(n_results or self.top_k)]
                for record, _ in top_results:
                    record.hit_count += 1
                    record.last_hit_at = datetime.utcnow()
                db.commit()

                # 返回结果
                return [
                    (record.question, record.answer, sim)
                    for record, sim in top_results
                ]

            finally:
                db.close()

        except Exception as e:
            print(f"SQL RAG search error: {e}")
            return []

    async def build_rag_context(
        self,
        query: str,
        job_id: Optional[int] = None,
        max_pairs: int = 3
    ) -> str:
        """构建 RAG 上下文字符串"""
        similar_pairs = await self.search_similar(query, job_id, n_results=max_pairs)

        if not similar_pairs:
            return ""

        context_parts = ["以下是相关的历史问答供参考："]
        for i, (question, answer, score) in enumerate(similar_pairs, 1):
            context_parts.append(f"\n参考{i}（相关度：{score:.2f}）：")
            context_parts.append(f"问：{question}")
            context_parts.append(f"答：{answer}")

        return "\n".join(context_parts)

    def get_knowledge_stats(self, job_id: Optional[int] = None) -> dict:
        """获取知识库统计信息"""
        db = self._get_db()
        try:
            query = db.query(KnowledgeBase)
            if job_id:
                query = query.filter(KnowledgeBase.job_id == job_id)

            total = query.count()
            top_hit = query.order_by(desc(KnowledgeBase.hit_count)).limit(5).all()

            return {
                "total_records": total,
                "top_hit_questions": [
                    {"question": k.question[:50], "hit_count": k.hit_count}
                    for k in top_hit
                ]
            }
        finally:
            db.close()

    # ============ 聊天记忆（备份）============

    def save_chat_to_db(
        self,
        conversation_id: int,
        role: str,
        content: str,
        message_type: str = "text"
    ) -> bool:
        """保存聊天记录到数据库（长期备份）"""
        try:
            db = self._get_db()
            try:
                memory = ChatMemory(
                    conversation_id=conversation_id,
                    role=role,
                    content=content,
                    message_type=message_type
                )
                db.add(memory)
                db.commit()
                return True
            finally:
                db.close()
        except Exception as e:
            print(f"Save chat memory error: {e}")
            return False

    def get_chat_history(
        self,
        conversation_id: int,
        limit: int = 20
    ) -> List[dict]:
        """获取聊天历史"""
        db = self._get_db()
        try:
            records = db.query(ChatMemory).filter(
                ChatMemory.conversation_id == conversation_id
            ).order_by(ChatMemory.created_at.desc()).limit(limit).all()

            # 反转顺序（最早的在前）
            records.reverse()

            return [
                {"role": r.role, "content": r.content}
                for r in records
            ]
        finally:
            db.close()


# 单例实例
sql_rag_service = SQLRAGService()
