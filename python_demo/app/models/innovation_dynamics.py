from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class DynamicType(str, enum.Enum):
    """动态类型"""
    DEMAND_PUBLISHED = "demand_published"
    BARRIER_PUBLISHED = "barrier_published"
    ACHIEVEMENT_PUBLISHED = "achievement_published"
    PROJECT_SIGNED = "project_signed"
    PROJECT_COMPLETED = "project_completed"
    BARRIER_SOLVED = "barrier_solved"


class InnovationDynamics(Base):
    __tablename__ = "innovation_dynamics"

    id = Column(Integer, primary_key=True, index=True)

    # 基本信息
    title = Column(String(200), nullable=False)
    description = Column(Text)

    # 动态详情
    dynamic_type = Column(Enum(DynamicType), nullable=False)  # 动态类型
    related_id = Column(Integer)  # 关联ID（需求ID、壁垒ID等）
    region = Column(String(100))  # 区域
    keywords = Column(JSON)  # 关键词列表

    # 统计信息
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)

    # 创建时间
    created_at = Column(DateTime, server_default=func.now())
