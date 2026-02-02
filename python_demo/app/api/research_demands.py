from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.research_demand import ResearchDemand, DemandStatus, DemandPriority
from ..schemas.research_demand import ResearchDemandCreate, ResearchDemandUpdate, ResearchDemandResponse
from ..services.websocket_manager import ws_manager

router = APIRouter()


@router.get("", response_model=List[ResearchDemandResponse])
async def get_research_demands(
    search: Optional[str] = Query(None),
    research_area: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取研发需求列表"""
    query = db.query(ResearchDemand).filter(ResearchDemand.status == DemandStatus.OPEN)

    if search:
        query = query.filter(
            (ResearchDemand.title.contains(search)) |
            (ResearchDemand.description.contains(search))
        )

    if research_area:
        query = query.filter(ResearchDemand.research_area == research_area)

    if category:
        query = query.filter(ResearchDemand.category == category)

    if priority:
        query = query.filter(ResearchDemand.priority == DemandPriority(priority))

    demands = query.order_by(ResearchDemand.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for demand in demands:
        demand_dict = ResearchDemandResponse.model_validate(demand).model_dump()
        # 增加浏览次数
        demand.view_count += 1
        db.commit()
        result.append(ResearchDemandResponse(**demand_dict))

    return result


@router.get("/my", response_model=List[ResearchDemandResponse])
async def get_my_demands(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我发布的研发需求"""
    if current_user.role != "enterprise":
        raise HTTPException(status_code=403, detail="只有企业用户可以查看自己发布的需求")

    demands = db.query(ResearchDemand).filter(
        ResearchDemand.enterprise_id == current_user.id
    ).order_by(ResearchDemand.created_at.desc()).all()

    result = []
    for demand in demands:
        demand_dict = ResearchDemandResponse.model_validate(demand).model_dump()
        result.append(ResearchDemandResponse(**demand_dict))

    return result


@router.get("/{demand_id}", response_model=ResearchDemandResponse)
async def get_demand(demand_id: int, db: Session = Depends(get_db)):
    """获取单个研发需求详情"""
    demand = db.query(ResearchDemand).filter(ResearchDemand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="研发需求不存在")

    demand_dict = ResearchDemandResponse.model_validate(demand).model_dump()
    return ResearchDemandResponse(**demand_dict)


@router.post("", response_model=ResearchDemandResponse)
async def create_demand(
    demand_data: ResearchDemandCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发布研发需求"""
    if current_user.role != "enterprise":
        raise HTTPException(status_code=403, detail="只有企业用户可以发布研发需求")

    demand = ResearchDemand(
        **demand_data.model_dump(),
        enterprise_id=current_user.id,
        enterprise_name=current_user.company
    )

    db.add(demand)
    db.commit()
    db.refresh(demand)

    # 广播新需求发布通知
    await ws_manager.broadcast_demand_published(demand)

    demand_dict = ResearchDemandResponse.model_validate(demand).model_dump()
    return ResearchDemandResponse(**demand_dict)


@router.put("/{demand_id}", response_model=ResearchDemandResponse)
async def update_demand(
    demand_id: int,
    demand_data: ResearchDemandUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新研发需求"""
    demand = db.query(ResearchDemand).filter(ResearchDemand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="研发需求不存在")

    if demand.enterprise_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此研发需求")

    update_data = demand_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(demand, field, DemandStatus(value))
        elif field == "priority" and value:
            setattr(demand, field, DemandPriority(value))
        else:
            setattr(demand, field, value)

    db.commit()
    db.refresh(demand)

    demand_dict = ResearchDemandResponse.model_validate(demand).model_dump()
    return ResearchDemandResponse(**demand_dict)


@router.delete("/{demand_id}")
async def delete_demand(
    demand_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除研发需求"""
    demand = db.query(ResearchDemand).filter(ResearchDemand.id == demand_id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="研发需求不存在")

    if demand.enterprise_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此研发需求")

    db.delete(demand)
    db.commit()

    return {"message": "研发需求已删除"}


@router.get("/stats/summary")
async def get_demand_stats(
    db: Session = Depends(get_db)
):
    """获取研发需求统计"""
    total = db.query(ResearchDemand).count()
    open_count = db.query(ResearchDemand).filter(ResearchDemand.status == DemandStatus.OPEN).count()
    in_progress_count = db.query(ResearchDemand).filter(ResearchDemand.status == DemandStatus.IN_PROGRESS).count()
    completed_count = db.query(ResearchDemand).filter(ResearchDemand.status == DemandStatus.COMPLETED).count()

    return {
        "total": total,
        "open": open_count,
        "in_progress": in_progress_count,
        "completed": completed_count
    }
