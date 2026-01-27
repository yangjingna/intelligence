# -*- coding: utf-8 -*-
"""
智能客服记忆服务
- 短时记忆：Redis（存储最近的对话上下文，用于连续对话）
- 长期记忆：MySQL（存储客服知识库，用于RAG检索）
"""
import numpy as np
from typing import List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..core.database import SessionLocal
from ..core.redis_client import redis_client
from ..models.knowledge import CustomerServiceKnowledge, CustomerServiceMemory
from .embedding_service import embedding_service


class CustomerServiceMemoryService:
    """智能客服记忆管理服务"""

    def __init__(self):
        self.max_short_term_messages = 20  # 短时记忆最大消息数
        self.similarity_threshold = 0.7
        self.top_k = 3

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

    # ============ 短时记忆（Redis + MySQL降级）============

    def _is_redis_available(self) -> bool:
        """检查Redis是否可用"""
        return redis_client.is_connected

    async def add_user_message(self, user_id: int, content: str) -> bool:
        """添加用户消息到短时记忆（同时保存到Redis和MySQL）"""
        redis_success = False
        mysql_success = False

        # 尝试保存到Redis
        if self._is_redis_available():
            redis_success = redis_client.append_customer_service_message(
                user_id=user_id,
                role="user",
                content=content,
                max_messages=self.max_short_term_messages
            )

        # 始终保存到MySQL作为备份
        mysql_success = self.save_message_to_db(user_id=user_id, role="user", content=content)

        return redis_success or mysql_success

    async def add_assistant_message(self, user_id: int, content: str) -> bool:
        """添加助手消息到短时记忆（同时保存到Redis和MySQL）"""
        redis_success = False
        mysql_success = False

        # 尝试保存到Redis
        if self._is_redis_available():
            redis_success = redis_client.append_customer_service_message(
                user_id=user_id,
                role="assistant",
                content=content,
                max_messages=self.max_short_term_messages
            )

        # 始终保存到MySQL作为备份
        mysql_success = self.save_message_to_db(user_id=user_id, role="assistant", content=content)

        return redis_success or mysql_success

    def get_short_term_context(self, user_id: int) -> List[dict]:
        """获取短时记忆上下文（用于连续对话）"""
        redis_available = self._is_redis_available()
        print(f"[DEBUG] Redis可用: {redis_available}")

        context = []

        # 优先从Redis获取
        if redis_available:
            redis_context = redis_client.get_customer_service_context(user_id)
            print(f"[DEBUG] 从Redis获取上下文: {len(redis_context) if redis_context else 0} 条")
            if redis_context and len(redis_context) > 0:
                context = redis_context

        # 如果Redis没有数据，从MySQL获取
        if not context:
            db_context = self.get_history_from_db(user_id=user_id, limit=self.max_short_term_messages)
            print(f"[DEBUG] 从MySQL获取上下文: {len(db_context)} 条")
            context = db_context

        print(f"[DEBUG] 最终返回上下文: {len(context)} 条消息")
        if context:
            print(f"[DEBUG] 最近消息预览: {context[-2:] if len(context) >= 2 else context}")

        return context

    def clear_short_term(self, user_id: int) -> bool:
        """清除用户的短时记忆"""
        if self._is_redis_available():
            return redis_client.clear_customer_service_context(user_id)
        return True  # 如果Redis不可用，视为成功（数据在MySQL中）

    def refresh_ttl(self, user_id: int) -> bool:
        """刷新短时记忆的过期时间"""
        if self._is_redis_available():
            return redis_client.extend_customer_service_ttl(user_id)
        return True  # MySQL没有TTL概念

    # ============ 长期记忆（MySQL）============

    async def index_qa_pair(
        self,
        question: str,
        answer: str,
        category: Optional[str] = None,
        keywords: Optional[str] = None,
        is_preset: bool = False
    ) -> bool:
        """索引问答对到客服知识库

        Args:
            question: 用户问题
            answer: 客服回答
            category: 问题分类
            keywords: 关键词
            is_preset: 是否为系统预设

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
                    similar = await self._find_similar_in_db(db, embedding, threshold=0.95)
                    if similar:
                        # 更新已有记录的答案
                        existing = db.query(CustomerServiceKnowledge).filter(
                            CustomerServiceKnowledge.id == similar[0][0]
                        ).first()
                        if existing:
                            existing.answer = answer
                            existing.updated_at = datetime.utcnow()
                            db.commit()
                            print(f"Updated existing customer service knowledge: id={existing.id}")
                            return True

                # 创建新记录
                knowledge = CustomerServiceKnowledge(
                    question=question,
                    answer=answer,
                    embedding=embedding,
                    category=category,
                    keywords=keywords,
                    is_preset=1 if is_preset else 0
                )
                db.add(knowledge)
                db.commit()
                print(f"Indexed new customer service knowledge: question={question[:50]}...")
                return True
            finally:
                db.close()

        except Exception as e:
            print(f"Customer service index error: {e}")
            return False

    async def _find_similar_in_db(
        self,
        db: Session,
        query_embedding: List[float],
        threshold: float = 0.7
    ) -> List[Tuple[int, float]]:
        """在数据库中查找相似记录

        Returns:
            List of (id, similarity_score)
        """
        records = db.query(CustomerServiceKnowledge).all()

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
        category: Optional[str] = None,
        n_results: Optional[int] = None
    ) -> List[Tuple[str, str, float]]:
        """检索相似历史问答

        Args:
            query: 查询文本
            category: 问题分类（可选）
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
                base_query = db.query(CustomerServiceKnowledge)

                if category:
                    records = base_query.filter(CustomerServiceKnowledge.category == category).all()
                else:
                    records = base_query.all()

                # 计算相似度
                results = []
                for record in records:
                    if record.embedding:
                        similarity = self._cosine_similarity(query_embedding, record.embedding)
                        if similarity >= self.similarity_threshold:
                            results.append((record, similarity))

                # 排序
                results.sort(key=lambda x: x[1], reverse=True)

                # 更新命中次数
                top_results = results[:(n_results or self.top_k)]
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
            print(f"Customer service search error: {e}")
            return []

    async def build_rag_context(
        self,
        query: str,
        category: Optional[str] = None,
        max_pairs: int = 3
    ) -> str:
        """构建 RAG 上下文字符串"""
        similar_pairs = await self.search_similar(query, category, n_results=max_pairs)

        if not similar_pairs:
            return ""

        context_parts = ["以下是相关的历史问答供参考："]
        for i, (question, answer, score) in enumerate(similar_pairs, 1):
            context_parts.append(f"\n参考{i}（相关度：{score:.2f}）：")
            context_parts.append(f"问：{question}")
            context_parts.append(f"答：{answer}")

        return "\n".join(context_parts)

    # ============ 组合上下文 ============

    async def get_combined_context(
        self,
        user_id: int,
        current_query: str,
        category: Optional[str] = None
    ) -> Tuple[List[dict], str]:
        """获取组合上下文（短时记忆 + RAG长期记忆）

        Returns:
            (short_term_messages, rag_context_str)
        """
        # 1. 获取短时记忆（最近对话）
        short_term = self.get_short_term_context(user_id)

        # 2. 获取长期记忆（RAG检索相关历史问答）
        rag_context = await self.build_rag_context(
            query=current_query,
            category=category,
            max_pairs=3
        )

        return short_term, rag_context

    # ============ 对话历史备份（MySQL）============

    def save_message_to_db(
        self,
        user_id: Optional[int],
        role: str,
        content: str,
        session_id: Optional[str] = None
    ) -> bool:
        """保存消息到数据库（长期备份）"""
        try:
            db = self._get_db()
            try:
                memory = CustomerServiceMemory(
                    user_id=user_id,
                    session_id=session_id,
                    role=role,
                    content=content
                )
                db.add(memory)
                db.commit()
                return True
            finally:
                db.close()
        except Exception as e:
            print(f"Save customer service memory error: {e}")
            return False

    def get_history_from_db(
        self,
        user_id: int,
        limit: int = 20
    ) -> List[dict]:
        """从数据库获取聊天历史"""
        db = self._get_db()
        try:
            records = db.query(CustomerServiceMemory).filter(
                CustomerServiceMemory.user_id == user_id
            ).order_by(CustomerServiceMemory.created_at.desc()).limit(limit).all()

            # 反转顺序（最早的在前）
            records.reverse()

            return [
                {"role": r.role, "content": r.content}
                for r in records
            ]
        finally:
            db.close()

    # ============ 知识库统计 ============

    def get_knowledge_stats(self) -> dict:
        """获取客服知识库统计信息"""
        db = self._get_db()
        try:
            total = db.query(CustomerServiceKnowledge).count()
            preset_count = db.query(CustomerServiceKnowledge).filter(
                CustomerServiceKnowledge.is_preset == 1
            ).count()
            top_hit = db.query(CustomerServiceKnowledge).order_by(
                desc(CustomerServiceKnowledge.hit_count)
            ).limit(5).all()

            return {
                "total_records": total,
                "preset_count": preset_count,
                "learned_count": total - preset_count,
                "top_hit_questions": [
                    {"question": k.question[:50], "hit_count": k.hit_count}
                    for k in top_hit
                ]
            }
        finally:
            db.close()


# 单例实例
customer_service_memory = CustomerServiceMemoryService()
