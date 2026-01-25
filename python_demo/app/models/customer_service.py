from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from ..core.database import Base


class CustomerServiceMessage(Base):
    __tablename__ = "customer_service_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)
    session_id = Column(Integer)

    created_at = Column(DateTime, server_default=func.now())
