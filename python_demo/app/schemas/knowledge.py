# -*- coding: utf-8 -*-
"""
知识库管理 Schema 定义
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class KnowledgeCreate(BaseModel):
    """创建知识条目"""
    question: str
    answer: str
    category: Optional[str] = None
    keywords: Optional[str] = None
    is_preset: bool = False


class KnowledgeUpdate(BaseModel):
    """更新知识条目"""
    question: Optional[str] = None
    answer: Optional[str] = None
    category: Optional[str] = None
    keywords: Optional[str] = None


class KnowledgeResponse(BaseModel):
    """知识条目响应"""
    id: int
    question: str
    answer: str
    category: Optional[str] = None
    keywords: Optional[str] = None
    hit_count: int
    is_preset: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeListResponse(BaseModel):
    """知识库列表响应"""
    items: List[KnowledgeResponse]
    total: int
    page: int
    page_size: int


class TopHitQuestion(BaseModel):
    """热门问题"""
    id: int
    question: str
    hit_count: int


class KnowledgeStats(BaseModel):
    """知识库统计信息"""
    total_records: int
    preset_count: int
    learned_count: int
    top_hit_questions: List[TopHitQuestion]
