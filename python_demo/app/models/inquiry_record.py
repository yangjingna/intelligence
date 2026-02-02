from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class InquiryStatus(str, enum.Enum):
    """咨询状态"""
    PENDING = "pending"
    RESPONDED = "responded"
    RESOLVED = "resolved"
    CLOSED = "closed"


class InquiryRecord(Base):
    __tablename__ = "inquiry_records"

    id = Column(Integer, primary_key=True, index=True)

    # 基本信息
    inquiry_type = Column(String(50))  # 咨询类型：demand, barrier, achievement
    demand_id = Column(Integer, ForeignKey("research_demands.id"), nullable=True)  # 需求ID
    target_id = Column(Integer)  # 目标ID（需求ID、壁垒ID等）- 保留用于兼容
    subject = Column(String(200), nullable=False)  # 咨询主题
    content = Column(Text, nullable=False)  # 咨询内容

    # 咨询方
    inquirer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inquirer_name = Column(String(100))
    inquirer_role = Column(String(20))  # 咨询者角色

    # 目标方（被咨询方）
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 咨询状态
    status = Column(Enum(InquiryStatus), default=InquiryStatus.PENDING)

    # 回复信息
    response = Column(Text)  # 回复内容
    responded_at = Column(DateTime)  # 回复时间

    # 统计信息
    view_count = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 关系
    inquirer = relationship("User", foreign_keys=[inquirer_id])
    target_user = relationship("User", foreign_keys=[target_user_id])
    demand = relationship("ResearchDemand", foreign_keys=[demand_id])
