from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import func
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.innovation_dynamics import InnovationDynamics, DynamicType
from ..models.research_demand import ResearchDemand, DemandStatus
from ..models.technical_barrier import TechnicalBarrier, BarrierStatus
from ..models.research_achievement import ResearchAchievement, AchievementStatus
from ..models.cooperation_project import CooperationProject, ProjectStatus
from ..schemas.innovation_dynamics import (
    InnovationDynamicsCreate,
    InnovationDynamicsUpdate,
    InnovationDynamicsResponse,
    InnovationStatsResponse
)

router = APIRouter()


@router.get("", response_model=List[InnovationDynamicsResponse])
async def get_innovation_dynamics(
    search: Optional[str] = Query(None),
    dynamic_type: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取创新动态列表"""
    # 只有政府用户可以访问创新动态
    if current_user.role.value != "government":
        raise HTTPException(status_code=403, detail="只有政府用户可以查看创新动态")

    query = db.query(InnovationDynamics)

    if search:
        query = query.filter(
            (InnovationDynamics.title.contains(search)) |
            (InnovationDynamics.description.contains(search))
        )

    if dynamic_type:
        query = query.filter(InnovationDynamics.dynamic_type == DynamicType(dynamic_type))

    if region:
        query = query.filter(InnovationDynamics.region == region)

    dynamics = query.order_by(InnovationDynamics.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for dynamic in dynamics:
        dynamic_dict = InnovationDynamicsResponse.model_validate(dynamic).model_dump()
        result.append(InnovationDynamicsResponse(**dynamic_dict))

    return result


@router.get("/{dynamic_id}", response_model=InnovationDynamicsResponse)
async def get_dynamic(
    dynamic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个创新动态详情"""
    if current_user.role.value != "government":
        raise HTTPException(status_code=403, detail="只有政府用户可以查看创新动态")

    dynamic = db.query(InnovationDynamics).filter(InnovationDynamics.id == dynamic_id).first()
    if not dynamic:
        raise HTTPException(status_code=404, detail="创新动态不存在")

    dynamic_dict = InnovationDynamicsResponse.model_validate(dynamic).model_dump()
    return InnovationDynamicsResponse(**dynamic_dict)


@router.post("", response_model=InnovationDynamicsResponse)
async def create_dynamic(
    dynamic_data: InnovationDynamicsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建创新动态"""
    if current_user.role.value != "government":
        raise HTTPException(status_code=403, detail="只有政府用户可以创建创新动态")

    dynamic = InnovationDynamics(**dynamic_data.model_dump())
    db.add(dynamic)
    db.commit()
    db.refresh(dynamic)

    dynamic_dict = InnovationDynamicsResponse.model_validate(dynamic).model_dump()
    return InnovationDynamicsResponse(**dynamic_dict)


@router.put("/{dynamic_id}", response_model=InnovationDynamicsResponse)
async def update_dynamic(
    dynamic_id: int,
    dynamic_data: InnovationDynamicsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新创新动态"""
    if current_user.role.value != "government":
        raise HTTPException(status_code=403, detail="只有政府用户可以修改创新动态")

    dynamic = db.query(InnovationDynamics).filter(InnovationDynamics.id == dynamic_id).first()
    if not dynamic:
        raise HTTPException(status_code=404, detail="创新动态不存在")

    update_data = dynamic_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dynamic, field, value)

    db.commit()
    db.refresh(dynamic)

    dynamic_dict = InnovationDynamicsResponse.model_validate(dynamic).model_dump()
    return InnovationDynamicsResponse(**dynamic_dict)


@router.delete("/{dynamic_id}")
async def delete_dynamic(
    dynamic_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除创新动态"""
    if current_user.role.value != "government":
        raise HTTPException(status_code=403, detail="只有政府用户可以删除创新动态")

    dynamic = db.query(InnovationDynamics).filter(InnovationDynamics.id == dynamic_id).first()
    if not dynamic:
        raise HTTPException(status_code=404, detail="创新动态不存在")

    db.delete(dynamic)
    db.commit()

    return {"message": "创新动态已删除"}


@router.get("/stats/summary", response_model=InnovationStatsResponse)
async def get_innovation_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取创新统计数据"""
    if current_user.role.value != "government":
        raise HTTPException(status_code=403, detail="只有政府用户可以查看统计数据")

    # 研发需求统计
    total_demands = db.query(ResearchDemand).filter(
        ResearchDemand.status == DemandStatus.OPEN
    ).count()

    # 技术壁垒统计
    total_barriers = db.query(TechnicalBarrier).filter(
        TechnicalBarrier.status == BarrierStatus.OPEN
    ).count()
    solved_barriers = db.query(TechnicalBarrier).filter(
        TechnicalBarrier.status == BarrierStatus.SOLVED
    ).count()

    # 研发成果统计
    total_achievements = db.query(ResearchAchievement).filter(
        ResearchAchievement.status == AchievementStatus.PUBLISHED
    ).count()

    # 合作项目统计
    total_projects = db.query(CooperationProject).count()
    completed_projects = db.query(CooperationProject).filter(
        CooperationProject.status == ProjectStatus.COMPLETED
    ).count()

    return InnovationStatsResponse(
        total_demands=total_demands,
        total_barriers=total_barriers,
        total_achievements=total_achievements,
        total_projects=total_projects,
        solved_barriers=solved_barriers,
        completed_projects=completed_projects
    )
