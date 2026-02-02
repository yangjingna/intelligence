from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class ProjectStatus(str, enum.Enum):
    """合作项目状态"""
    PENDING = "pending"
    SIGNED = "signed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CooperationProject(Base):
    __tablename__ = "cooperation_projects"

    id = Column(Integer, primary_key=True, index=True)

    # 基本信息
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # 关联信息
    demand_id = Column(Integer, ForeignKey("research_demands.id"), nullable=True)
    barrier_id = Column(Integer, ForeignKey("technical_barriers.id"), nullable=True)
    achievement_id = Column(Integer, ForeignKey("research_achievements.id"), nullable=True)

    # 合作方
    enterprise_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    enterprise_name = Column(String(200))
    university_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    university_name = Column(String(200))

    # 项目详情
    project_type = Column(String(50))  # 项目类型
    budget = Column(Float)  # 预算
    duration = Column(String(50))  # 项目周期
    start_date = Column(DateTime)  # 开始日期
    end_date = Column(DateTime)  # 结束日期

    # 项目状态
    status = Column(Enum(ProjectStatus), default=ProjectStatus.PENDING)

    # 备注
    notes = Column(Text)

    # 统计信息
    milestone_count = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关系
    demand = relationship("ResearchDemand", foreign_keys=[demand_id])
    barrier = relationship("TechnicalBarrier", foreign_keys=[barrier_id])
    achievement = relationship("ResearchAchievement", foreign_keys=[achievement_id])
    enterprise = relationship("User", foreign_keys=[enterprise_id])
    university_user = relationship("User", foreign_keys=[university_id])
