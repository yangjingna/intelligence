# -*- coding: utf-8 -*-
"""
聊天记忆服务
- 短时记忆：Redis（存储最近的对话上下文，用于连续对话）
- 长期记忆：MySQL（存储历史问答对，用于RAG检索）
- 降级方案：当Redis不可用时，使用MySQL作为备选
"""
from typing import List, Optional, Tuple
from ..core.redis_client import redis_client
from .sql_rag_service import sql_rag_service


class MemoryService:
    """聊天记忆管理服务（带降级支持）"""

    def __init__(self):
        self.max_short_term_messages = 10  # 短时记忆最大消息数

    def _is_redis_available(self) -> bool:
        """检查Redis是否可用"""
        return redis_client.is_connected

    async def add_user_message(
        self,
        conversation_id: int,
        content: str
    ) -> bool:
        """添加用户消息到短时记忆"""
        # 优先使用Redis
        if self._is_redis_available():
            result = redis_client.append_message(
                conversation_id=conversation_id,
                role="user",
                content=content,
                max_messages=self.max_short_term_messages
            )
            if result:
                return True

        # Redis不可用时降级到MySQL
        return sql_rag_service.save_chat_to_db(
            conversation_id=conversation_id,
            role="user",
            content=content,
            message_type="text"
        )

    async def add_assistant_message(
        self,
        conversation_id: int,
        content: str,
        is_ai: bool = False
    ) -> bool:
        """添加助手/HR消息到短时记忆"""
        role = "assistant"

        # 优先使用Redis
        if self._is_redis_available():
            result = redis_client.append_message(
                conversation_id=conversation_id,
                role=role,
                content=content,
                max_messages=self.max_short_term_messages
            )
            if result:
                return True

        # Redis不可用时降级到MySQL
        return sql_rag_service.save_chat_to_db(
            conversation_id=conversation_id,
            role=role,
            content=content,
            message_type="ai_response" if is_ai else "text"
        )

    def get_short_term_context(self, conversation_id: int) -> List[dict]:
        """获取短时记忆上下文（用于连续对话）"""
        # 优先从Redis获取
        if self._is_redis_available():
            context = redis_client.get_chat_context(conversation_id)
            if context:
                return context

        # Redis不可用或为空时从MySQL获取
        return sql_rag_service.get_chat_history(
            conversation_id=conversation_id,
            limit=self.max_short_term_messages
        )

    async def get_combined_context(
        self,
        conversation_id: int,
        current_query: str,
        job_id: Optional[int] = None
    ) -> Tuple[List[dict], str]:
        """获取组合上下文（短时记忆 + RAG长期记忆）

        Returns:
            (short_term_messages, rag_context_str)
        """
        # 1. 获取短时记忆（最近对话）
        short_term = self.get_short_term_context(conversation_id)

        # 2. 获取长期记忆（SQL RAG检索相关历史问答）
        rag_context = await sql_rag_service.build_rag_context(
            query=current_query,
            job_id=job_id,
            max_pairs=3
        )

        return short_term, rag_context

    async def save_to_long_term(
        self,
        question: str,
        answer: str,
        job_id: Optional[int] = None,
        hr_id: Optional[int] = None,
        conversation_id: Optional[int] = None
    ) -> bool:
        """保存问答对到长期记忆（MySQL知识库）"""
        return await sql_rag_service.index_qa_pair(
            question=question,
            answer=answer,
            job_id=job_id,
            hr_id=hr_id,
            conversation_id=conversation_id
        )

    def clear_short_term(self, conversation_id: int) -> bool:
        """清除会话的短时记忆"""
        return redis_client.clear_chat_context(conversation_id)

    def refresh_ttl(self, conversation_id: int) -> bool:
        """刷新短时记忆的过期时间"""
        return redis_client.extend_ttl(conversation_id)


# 单例实例
memory_service = MemoryService()
