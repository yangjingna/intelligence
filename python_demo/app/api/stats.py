# -*- coding: utf-8 -*-
"""
全局统计数据 API
"""
from fastapi import APIRouter
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..core.database import get_db
from ..models.user import User
from ..models.job import Job
from ..models.knowledge import KnowledgeBase

router = APIRouter()


class StatsResponse(BaseModel):
    """平台统计数据"""
    enterprise_count: int  # 企业用户数
    student_count: int    # 学生用户数
    job_count: int       # 岗位发布数
    knowledge_count: int  # 知识库条目数
    satisfaction_rate: Optional[str] = "98%"  # 用户满意度（暂时固定）


@router.get("/platform", response_model=StatsResponse)
async def get_platform_stats(db: Session = Depends(get_db)):
    """获取平台统计数据"""
    # 企业用户数
    enterprise_count = db.query(User).filter(User.role == "enterprise").count()

    # 学生用户数
    student_count = db.query(User).filter(User.role == "student").count()

    # 岗位发布数
    job_count = db.query(Job).count()

    # 知识库条目数
    knowledge_count = db.query(KnowledgeBase).count()

    return StatsResponse(
        enterprise_count=enterprise_count,
        student_count=student_count,
        job_count=job_count,
        knowledge_count=knowledge_count,
        satisfaction_rate="98%"
    )
