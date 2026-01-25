# -*- coding: utf-8 -*-
from pydantic import BaseModel
from typing import List


class ConversationSummaryResponse(BaseModel):
    """会话总结响应模型"""
    conversation_id: int
    summary: str
    key_points: List[str]
    user_interests: List[str]
    suggested_actions: List[str]

    class Config:
        from_attributes = True
