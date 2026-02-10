from fastapi import APIRouter
from .auth import router as auth_router
from .jobs import router as jobs_router
from .resources import router as resources_router
from .chat import router as chat_router
from .customer_service import router as customer_service_router
from .summary import router as summary_router
from .knowledge import router as knowledge_router
from .research_demands import router as research_demands_router
from .technical_barriers import router as technical_barriers_router
from .research_achievements import router as research_achievements_router
from .cooperation_projects import router as cooperation_projects_router
from .inquiry_records import router as inquiry_records_router
from .innovation_dynamics import router as innovation_dynamics_router
from .stats import router as stats_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["岗位管理"])
api_router.include_router(resources_router, prefix="/resources", tags=["资源管理"])
api_router.include_router(chat_router, prefix="/chat", tags=["聊天"])
api_router.include_router(customer_service_router, prefix="/customer-service", tags=["智能客服"])
api_router.include_router(summary_router, prefix="/summary", tags=["智能总结"])
api_router.include_router(knowledge_router, prefix="/knowledge", tags=["知识库管理"])
api_router.include_router(research_demands_router, prefix="/research-demands", tags=["研发需求"])
api_router.include_router(technical_barriers_router, prefix="/technical-barriers", tags=["技术壁垒"])
api_router.include_router(research_achievements_router, prefix="/research-achievements", tags=["研发成果"])
api_router.include_router(cooperation_projects_router, prefix="/cooperation-projects", tags=["合作项目"])
api_router.include_router(inquiry_records_router, prefix="/inquiry-records", tags=["咨询记录"])
api_router.include_router(innovation_dynamics_router, prefix="/innovation-dynamics", tags=["创新动态"])
api_router.include_router(stats_router, prefix="/stats", tags=["统计数据"])
