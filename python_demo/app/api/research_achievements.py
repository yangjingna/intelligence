from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.research_achievement import ResearchAchievement, AchievementStatus
from ..schemas.research_achievement import (
    ResearchAchievementCreate,
    ResearchAchievementUpdate,
    ResearchAchievementResponse
)
from ..services.websocket_manager import ws_manager

router = APIRouter()


@router.get("", response_model=List[ResearchAchievementResponse])
async def get_research_achievements(
    search: Optional[str] = Query(None),
    research_area: Optional[str] = Query(None),
    application_field: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """获取研发成果列表"""
    query = db.query(ResearchAchievement).filter(
        ResearchAchievement.status == AchievementStatus.PUBLISHED
    )

    if search:
        query = query.filter(
            (ResearchAchievement.title.contains(search)) |
            (ResearchAchievement.description.contains(search))
        )

    if research_area:
        query = query.filter(ResearchAchievement.research_area == research_area)

    if application_field:
        query = query.filter(ResearchAchievement.application_field == application_field)

    if category:
        query = query.filter(ResearchAchievement.category == category)

    achievements = query.order_by(ResearchAchievement.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for achievement in achievements:
        achievement_dict = ResearchAchievementResponse.model_validate(achievement).model_dump()
        # 增加浏览次数
        achievement.view_count += 1
        db.commit()
        result.append(ResearchAchievementResponse(**achievement_dict))

    return result


@router.get("/my", response_model=List[ResearchAchievementResponse])
async def get_my_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取我发布的研发成果"""
    if current_user.role != "university":
        raise HTTPException(status_code=403, detail="只有高校用户可以查看自己发布的成果")

    achievements = db.query(ResearchAchievement).filter(
        ResearchAchievement.university_id == current_user.id
    ).order_by(ResearchAchievement.created_at.desc()).all()

    result = []
    for achievement in achievements:
        achievement_dict = ResearchAchievementResponse.model_validate(achievement).model_dump()
        result.append(ResearchAchievementResponse(**achievement_dict))

    return result


@router.get("/{achievement_id}", response_model=ResearchAchievementResponse)
async def get_achievement(achievement_id: int, db: Session = Depends(get_db)):
    """获取单个研发成果详情"""
    achievement = db.query(ResearchAchievement).filter(
        ResearchAchievement.id == achievement_id
    ).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="研发成果不存在")

    achievement_dict = ResearchAchievementResponse.model_validate(achievement).model_dump()
    return ResearchAchievementResponse(**achievement_dict)


@router.post("", response_model=ResearchAchievementResponse)
async def create_achievement(
    achievement_data: ResearchAchievementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建研发成果"""
    if current_user.role != "university":
        raise HTTPException(status_code=403, detail="只有高校用户可以发布研发成果")

    achievement = ResearchAchievement(
        **achievement_data.model_dump(),
        university_id=current_user.id,
        university_name=current_user.university
    )

    db.add(achievement)
    db.commit()
    db.refresh(achievement)

    # 如果是直接发布状态，广播通知
    if achievement.status == AchievementStatus.PUBLISHED:
        await ws_manager.broadcast_achievement_published(achievement)

    achievement_dict = ResearchAchievementResponse.model_validate(achievement).model_dump()
    return ResearchAchievementResponse(**achievement_dict)


@router.put("/{achievement_id}", response_model=ResearchAchievementResponse)
async def update_achievement(
    achievement_id: int,
    achievement_data: ResearchAchievementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新研发成果"""
    achievement = db.query(ResearchAchievement).filter(
        ResearchAchievement.id == achievement_id
    ).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="研发成果不存在")

    if achievement.university_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此研发成果")

    update_data = achievement_data.model_dump(exclude_unset=True)
    old_status = achievement.status

    for field, value in update_data.items():
        if field == "status" and value:
            setattr(achievement, field, AchievementStatus(value))
        else:
            setattr(achievement, field, value)

    db.commit()
    db.refresh(achievement)

    # 如果从草稿状态变为发布状态，广播通知
    if old_status != AchievementStatus.PUBLISHED and achievement.status == AchievementStatus.PUBLISHED:
        await ws_manager.broadcast_achievement_published(achievement)

    achievement_dict = ResearchAchievementResponse.model_validate(achievement).model_dump()
    return ResearchAchievementResponse(**achievement_dict)


@router.delete("/{achievement_id}")
async def delete_achievement(
    achievement_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除研发成果"""
    achievement = db.query(ResearchAchievement).filter(
        ResearchAchievement.id == achievement_id
    ).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="研发成果不存在")

    if achievement.university_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此研发成果")

    db.delete(achievement)
    db.commit()

    return {"message": "研发成果已删除"}


@router.get("/stats/summary")
async def get_achievement_stats(
    db: Session = Depends(get_db)
):
    """获取研发成果统计"""
    total = db.query(ResearchAchievement).count()
    draft_count = db.query(ResearchAchievement).filter(
        ResearchAchievement.status == AchievementStatus.DRAFT
    ).count()
    published_count = db.query(ResearchAchievement).filter(
        ResearchAchievement.status == AchievementStatus.PUBLISHED
    ).count()

    return {
        "total": total,
        "draft": draft_count,
        "published": published_count
    }
