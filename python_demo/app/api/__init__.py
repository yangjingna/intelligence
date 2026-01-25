from fastapi import APIRouter
from .auth import router as auth_router
from .jobs import router as jobs_router
from .resources import router as resources_router
from .chat import router as chat_router
from .customer_service import router as customer_service_router
from .summary import router as summary_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["岗位管理"])
api_router.include_router(resources_router, prefix="/resources", tags=["资源管理"])
api_router.include_router(chat_router, prefix="/chat", tags=["聊天"])
api_router.include_router(customer_service_router, prefix="/customer-service", tags=["智能客服"])
api_router.include_router(summary_router, prefix="/summary", tags=["智能总结"])
