# -*- coding: utf-8 -*-
"""
知识库模型 - 存储 HR 问答对（长期记忆）
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.sql import func
from ..core.database import Base


class KnowledgeBase(Base):
    """知识库表 - 存储历史问答对"""
    __tablename__ = "knowledge_base"

    id = Column(Integer, primary_key=True, index=True)

    # 问答内容
    question = Column(Text, nullable=False, comment="用户问题")
    answer = Column(Text, nullable=False, comment="HR回答")

    # 向量嵌入（存储为 JSON 数组）
    embedding = Column(JSON, nullable=True, comment="问题的向量嵌入")

    # 关联信息
    job_id = Column(Integer, index=True, nullable=True, comment="关联岗位ID")
    hr_id = Column(Integer, index=True, nullable=True, comment="HR用户ID")
    conversation_id = Column(Integer, index=True, nullable=True, comment="会话ID")

    # 元数据
    category = Column(String(50), nullable=True, comment="问题分类")
    keywords = Column(String(500), nullable=True, comment="关键词，逗号分隔")

    # 统计信息
    hit_count = Column(Integer, default=0, comment="命中次数")
    last_hit_at = Column(DateTime, nullable=True, comment="最后命中时间")

    # 时间戳
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<KnowledgeBase(id={self.id}, question={self.question[:30]}...)>"


class ChatMemory(Base):
    """聊天记忆表 - 存储对话历史（备份短期记忆）"""
    __tablename__ = "chat_memory"

    id = Column(Integer, primary_key=True, index=True)

    conversation_id = Column(Integer, index=True, nullable=False, comment="会话ID")
    role = Column(String(20), nullable=False, comment="角色: user/assistant/system")
    content = Column(Text, nullable=False, comment="消息内容")

    # 消息类型
    message_type = Column(String(20), default="text", comment="消息类型: text/ai_response")

    # 时间戳
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<ChatMemory(id={self.id}, conv={self.conversation_id}, role={self.role})>"


class CustomerServiceKnowledge(Base):
    """客服知识库表 - 存储智能客服常见问答"""
    __tablename__ = "customer_service_knowledge"

    id = Column(Integer, primary_key=True, index=True)

    # 问答内容
    question = Column(Text, nullable=False, comment="用户问题")
    answer = Column(Text, nullable=False, comment="客服回答")

    # 向量嵌入（存储为 JSON 数组）
    embedding = Column(JSON, nullable=True, comment="问题的向量嵌入")

    # 分类和标签
    category = Column(String(50), nullable=True, comment="问题分类：平台功能/注册登录/岗位招聘/资源中心/其他")
    keywords = Column(String(500), nullable=True, comment="关键词，逗号分隔")

    # 统计信息
    hit_count = Column(Integer, default=0, comment="命中次数")
    last_hit_at = Column(DateTime, nullable=True, comment="最后命中时间")

    # 是否为系统预设
    is_preset = Column(Integer, default=0, comment="是否为系统预设问答: 0-否, 1-是")

    # 时间戳
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<CustomerServiceKnowledge(id={self.id}, question={self.question[:30]}...)>"


class CustomerServiceMemory(Base):
    """客服对话记忆表 - 存储客服对话历史（长期备份）"""
    __tablename__ = "customer_service_memory"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, index=True, nullable=True, comment="用户ID（可为空，支持匿名用户）")
    session_id = Column(String(100), index=True, nullable=True, comment="会话ID（用于匿名用户）")
    role = Column(String(20), nullable=False, comment="角色: user/assistant")
    content = Column(Text, nullable=False, comment="消息内容")

    # 时间戳
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<CustomerServiceMemory(id={self.id}, user_id={self.user_id}, role={self.role})>"
