# -*- coding: utf-8 -*-
import json
from typing import Optional, List
import redis
from .config import settings


class RedisClient:
    """Redis 客户端 - 用于存储短时记忆（聊天上下文）"""
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            try:
                self._client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=settings.REDIS_DB,
                    password=settings.REDIS_PASSWORD or None,
                    decode_responses=True
                )
                # 测试连接
                self._client.ping()
                print("Redis connected successfully")
            except redis.ConnectionError as e:
                print(f"Redis connection failed: {e}")
                self._client = None

    @property
    def is_connected(self) -> bool:
        """检查 Redis 是否连接"""
        if self._client is None:
            return False
        try:
            self._client.ping()
            return True
        except:
            return False

    def _get_context_key(self, conversation_id: int) -> str:
        """生成会话上下文的 Redis key"""
        return f"chat:context:{conversation_id}"

    def _get_user_context_key(self, user_id: int, conversation_id: int) -> str:
        """生成用户会话上下文的 Redis key"""
        return f"chat:user:{user_id}:conv:{conversation_id}"

    def save_chat_context(
        self,
        conversation_id: int,
        messages: List[dict],
        ttl: Optional[int] = None
    ) -> bool:
        """保存聊天上下文到 Redis

        Args:
            conversation_id: 会话ID
            messages: 消息列表 [{"role": "user/assistant", "content": "..."}]
            ttl: 过期时间（秒），默认使用配置值
        """
        if not self.is_connected:
            return False

        try:
            key = self._get_context_key(conversation_id)
            data = json.dumps(messages, ensure_ascii=False)
            self._client.setex(
                key,
                ttl or settings.CHAT_CONTEXT_TTL,
                data
            )
            return True
        except Exception as e:
            print(f"Redis save error: {e}")
            return False

    def get_chat_context(self, conversation_id: int) -> Optional[List[dict]]:
        """获取聊天上下文

        Returns:
            消息列表 或 None
        """
        if not self.is_connected:
            return None

        try:
            key = self._get_context_key(conversation_id)
            data = self._client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Redis get error: {e}")
            return None

    def append_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        max_messages: int = 20
    ) -> bool:
        """追加消息到聊天上下文

        Args:
            conversation_id: 会话ID
            role: 角色 ("user" 或 "assistant")
            content: 消息内容
            max_messages: 最大保留消息数
        """
        if not self.is_connected:
            return False

        try:
            messages = self.get_chat_context(conversation_id) or []
            messages.append({"role": role, "content": content})

            # 保留最近的 N 条消息
            if len(messages) > max_messages:
                messages = messages[-max_messages:]

            return self.save_chat_context(conversation_id, messages)
        except Exception as e:
            print(f"Redis append error: {e}")
            return False

    def clear_chat_context(self, conversation_id: int) -> bool:
        """清除聊天上下文"""
        if not self.is_connected:
            return False

        try:
            key = self._get_context_key(conversation_id)
            self._client.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete error: {e}")
            return False

    def extend_ttl(self, conversation_id: int, ttl: Optional[int] = None) -> bool:
        """延长聊天上下文的过期时间"""
        if not self.is_connected:
            return False

        try:
            key = self._get_context_key(conversation_id)
            self._client.expire(key, ttl or settings.CHAT_CONTEXT_TTL)
            return True
        except Exception as e:
            print(f"Redis expire error: {e}")
            return False

    # ============ 智能客服会话管理 ============

    def _get_customer_service_key(self, user_id: int) -> str:
        """生成客服会话的 Redis key（使用 user_id 作为标识）"""
        return f"customer_service:context:{user_id}"

    def save_customer_service_context(
        self,
        user_id: int,
        messages: List[dict],
        ttl: Optional[int] = None
    ) -> bool:
        """保存客服聊天上下文到 Redis

        Args:
            user_id: 用户ID
            messages: 消息列表 [{"role": "user/assistant", "content": "..."}]
            ttl: 过期时间（秒），默认使用配置值
        """
        if not self.is_connected:
            return False

        try:
            key = self._get_customer_service_key(user_id)
            data = json.dumps(messages, ensure_ascii=False)
            self._client.setex(
                key,
                ttl or settings.CHAT_CONTEXT_TTL,
                data
            )
            return True
        except Exception as e:
            print(f"Redis save customer service error: {e}")
            return False

    def get_customer_service_context(self, user_id: int) -> Optional[List[dict]]:
        """获取客服聊天上下文

        Returns:
            消息列表 或 None
        """
        if not self.is_connected:
            return None

        try:
            key = self._get_customer_service_key(user_id)
            data = self._client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            print(f"Redis get customer service error: {e}")
            return None

    def append_customer_service_message(
        self,
        user_id: int,
        role: str,
        content: str,
        max_messages: int = 20
    ) -> bool:
        """追加消息到客服聊天上下文

        Args:
            user_id: 用户ID
            role: 角色 ("user" 或 "assistant")
            content: 消息内容
            max_messages: 最大保留消息数
        """
        if not self.is_connected:
            return False

        try:
            messages = self.get_customer_service_context(user_id) or []
            messages.append({"role": role, "content": content})

            # 保留最近的 N 条消息
            if len(messages) > max_messages:
                messages = messages[-max_messages:]

            return self.save_customer_service_context(user_id, messages)
        except Exception as e:
            print(f"Redis append customer service error: {e}")
            return False

    def clear_customer_service_context(self, user_id: int) -> bool:
        """清除客服聊天上下文"""
        if not self.is_connected:
            return False

        try:
            key = self._get_customer_service_key(user_id)
            self._client.delete(key)
            return True
        except Exception as e:
            print(f"Redis delete customer service error: {e}")
            return False

    def extend_customer_service_ttl(self, user_id: int, ttl: Optional[int] = None) -> bool:
        """延长客服聊天上下文的过期时间"""
        if not self.is_connected:
            return False

        try:
            key = self._get_customer_service_key(user_id)
            self._client.expire(key, ttl or settings.CHAT_CONTEXT_TTL)
            return True
        except Exception as e:
            print(f"Redis expire customer service error: {e}")
            return False


# 单例实例
redis_client = RedisClient()
