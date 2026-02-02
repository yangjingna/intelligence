from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class AchievementStatus(str, enum.Enum):
    """研发成果状态"""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class ResearchAchievement(Base):
    __tablename__ = "research_achievements"

    id = Column(Integer, primary_key=True, index=True)

    # 基本信息
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # 成果详情
    research_area = Column(String(100))  # 研究领域
    application_field = Column(String(100))  # 应用领域
    innovation_points = Column(Text)  # 创新点
    technical_indicators = Column(Text)  # 技术指标
    market_potential = Column(Text)  # 市场潜力

    # 分类和标签
    category = Column(String(100))
    tags = Column(JSON)  # 标签列表

    # 成果状态
    status = Column(Enum(AchievementStatus), default=AchievementStatus.DRAFT)

    # 发布信息
    university_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    university_name = Column(String(200))

    # 统计信息
    view_count = Column(Integer, default=0)
    inquiry_count = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关系
    university = relationship("User", foreign_keys=[university_id])
