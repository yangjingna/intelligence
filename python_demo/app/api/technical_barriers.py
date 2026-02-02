from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.technical_barrier import TechnicalBarrier, BarrierStatus, BarrierDifficulty
from ..schemas.technical_barrier import TechnicalBarrierCreate, TechnicalBarrierUpdate, TechnicalBarrierResponse
from ..services.websocket_manager import ws_manager

router = APIRouter()


@router.get("", response_model=List[TechnicalBarrierResponse])
async def get_technical_barriers(
    search: Optional[str] = Query(None),
    technical_area: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取技术壁垒列表"""
    query = db.query(TechnicalBarrier).filter(TechnicalBarrier.status == BarrierStatus.OPEN)

    if search:
        query = query.filter(
            (TechnicalBarrier.title.contains(search)) |
            (TechnicalBarrier.description.contains(search))
        )

    if technical_area:
        query = query.filter(TechnicalBarrier.technical_area == technical_area)

    if category:
        query = query.filter(TechnicalBarrier.category == category)

    if difficulty:
        query = query.filter(TechnicalBarrier.difficulty == BarrierDifficulty(difficulty))

    barriers = query.order_by(TechnicalBarrier.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for barrier in barriers:
        barrier_dict = TechnicalBarrierResponse.model_validate(barrier).model_dump()
        # 增加浏览次数
        barrier.view_count += 1
        db.commit()
        result.append(TechnicalBarrierResponse(**barrier_dict))

    return result


@router.get("/my", response_model=List[TechnicalBarrierResponse])
async def get_my_barriers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我发布的技术壁垒"""
    if current_user.role != "enterprise":
        raise HTTPException(status_code=403, detail="只有企业用户可以查看自己发布的壁垒")

    barriers = db.query(TechnicalBarrier).filter(
        TechnicalBarrier.enterprise_id == current_user.id
    ).order_by(TechnicalBarrier.created_at.desc()).all()

    result = []
    for barrier in barriers:
        barrier_dict = TechnicalBarrierResponse.model_validate(barrier).model_dump()
        result.append(TechnicalBarrierResponse(**barrier_dict))

    return result


@router.get("/{barrier_id}", response_model=TechnicalBarrierResponse)
async def get_barrier(barrier_id: int, db: Session = Depends(get_db)):
    """获取单个技术壁垒详情"""
    barrier = db.query(TechnicalBarrier).filter(TechnicalBarrier.id == barrier_id).first()
    if not barrier:
        raise HTTPException(status_code=404, detail="技术壁垒不存在")

    barrier_dict = TechnicalBarrierResponse.model_validate(barrier).model_dump()
    return TechnicalBarrierResponse(**barrier_dict)


@router.post("", response_model=TechnicalBarrierResponse)
async def create_barrier(
    barrier_data: TechnicalBarrierCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发布技术壁垒"""
    if current_user.role != "enterprise":
        raise HTTPException(status_code=403, detail="只有企业用户可以发布技术壁垒")

    barrier = TechnicalBarrier(
        **barrier_data.model_dump(),
        enterprise_id=current_user.id,
        enterprise_name=current_user.company
    )

    db.add(barrier)
    db.commit()
    db.refresh(barrier)

    # 广播新技术壁垒发布通知
    await ws_manager.broadcast_barrier_published(barrier)

    barrier_dict = TechnicalBarrierResponse.model_validate(barrier).model_dump()
    return TechnicalBarrierResponse(**barrier_dict)


@router.put("/{barrier_id}", response_model=TechnicalBarrierResponse)
async def update_barrier(
    barrier_id: int,
    barrier_data: TechnicalBarrierUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新技术壁垒"""
    barrier = db.query(TechnicalBarrier).filter(TechnicalBarrier.id == barrier_id).first()
    if not barrier:
        raise HTTPException(status_code=404, detail="技术壁垒不存在")

    if barrier.enterprise_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此技术壁垒")

    update_data = barrier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(barrier, field, BarrierStatus(value))
        elif field == "difficulty" and value:
            setattr(barrier, field, BarrierDifficulty(value))
        else:
            setattr(barrier, field, value)

    db.commit()
    db.refresh(barrier)

    barrier_dict = TechnicalBarrierResponse.model_validate(barrier).model_dump()
    return TechnicalBarrierResponse(**barrier_dict)


@router.delete("/{barrier_id}")
async def delete_barrier(
    barrier_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除技术壁垒"""
    barrier = db.query(TechnicalBarrier).filter(TechnicalBarrier.id == barrier_id).first()
    if not barrier:
        raise HTTPException(status_code=404, detail="技术壁垒不存在")

    if barrier.enterprise_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此技术壁垒")

    db.delete(barrier)
    db.commit()

    return {"message": "技术壁垒已删除"}


@router.get("/stats/summary")
async def get_barrier_stats(
    db: Session = Depends(get_db)
):
    """获取技术壁垒统计"""
    total = db.query(TechnicalBarrier).count()
    open_count = db.query(TechnicalBarrier).filter(TechnicalBarrier.status == BarrierStatus.OPEN).count()
    solved_count = db.query(TechnicalBarrier).filter(TechnicalBarrier.status == BarrierStatus.SOLVED).count()

    return {
        "total": total,
        "open": open_count,
        "solved": solved_count
    }
