from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.cooperation_project import CooperationProject, ProjectStatus
from ..schemas.cooperation_project import (
    CooperationProjectCreate,
    CooperationProjectUpdate,
    CooperationProjectResponse
)
from ..services.websocket_manager import ws_manager

router = APIRouter()


@router.get("", response_model=List[CooperationProjectResponse])
async def get_cooperation_projects(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    project_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取合作项目列表"""
    query = db.query(CooperationProject)

    # 根据用户角色过滤
    if current_user.role == "enterprise":
        query = query.filter(CooperationProject.enterprise_id == current_user.id)
    elif current_user.role == "university":
        query = query.filter(CooperationProject.university_id == current_user.id)
    else:
        # 政府用户可以查看所有项目
        pass

    if search:
        query = query.filter(
            (CooperationProject.title.contains(search)) |
            (CooperationProject.description.contains(search))
        )

    if status:
        query = query.filter(CooperationProject.status == ProjectStatus(status))

    if project_type:
        query = query.filter(CooperationProject.project_type == project_type)

    projects = query.order_by(CooperationProject.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for project in projects:
        project_dict = CooperationProjectResponse.model_validate(project).model_dump()
        result.append(CooperationProjectResponse(**project_dict))

    return result


@router.get("/{project_id}", response_model=CooperationProjectResponse)
async def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个合作项目详情"""
    project = db.query(CooperationProject).filter(CooperationProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="合作项目不存在")

    # 权限检查
    if current_user.role not in ["enterprise", "university", "government"]:
        raise HTTPException(status_code=403, detail="无权访问此项目")

    project_dict = CooperationProjectResponse.model_validate(project).model_dump()
    return CooperationProjectResponse(**project_dict)


@router.post("", response_model=CooperationProjectResponse)
async def create_project(
    project_data: CooperationProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建合作项目"""
    if current_user.role not in ["enterprise", "university"]:
        raise HTTPException(status_code=403, detail="只有企业和高校用户可以创建合作项目")

    project = CooperationProject(
        **project_data.model_dump()
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    project_dict = CooperationProjectResponse.model_validate(project).model_dump()
    return CooperationProjectResponse(**project_dict)


@router.put("/{project_id}", response_model=CooperationProjectResponse)
async def update_project(
    project_id: int,
    project_data: CooperationProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新合作项目"""
    project = db.query(CooperationProject).filter(CooperationProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="合作项目不存在")

    # 权限检查
    is_enterprise = project.enterprise_id == current_user.id
    is_university = project.university_id == current_user.id
    if not (is_enterprise or is_university):
        raise HTTPException(status_code=403, detail="无权修改此合作项目")

    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            new_status = ProjectStatus(value)
            setattr(project, field, new_status)
            # 状态变化时广播通知
            if new_status == ProjectStatus.SIGNED:
                await ws_manager.broadcast_project_signed(project)
            elif new_status == ProjectStatus.COMPLETED:
                await ws_manager.broadcast_project_completed(project)
        else:
            setattr(project, field, value)

    db.commit()
    db.refresh(project)

    project_dict = CooperationProjectResponse.model_validate(project).model_dump()
    return CooperationProjectResponse(**project_dict)


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除合作项目"""
    project = db.query(CooperationProject).filter(CooperationProject.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="合作项目不存在")

    # 权限检查
    is_enterprise = project.enterprise_id == current_user.id
    is_university = project.university_id == current_user.id
    if not (is_enterprise or is_university):
        raise HTTPException(status_code=403, detail="无权删除此合作项目")

    db.delete(project)
    db.commit()

    return {"message": "合作项目已删除"}


@router.get("/stats/summary")
async def get_project_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取合作项目统计"""
    query = db.query(CooperationProject)

    if current_user.role == "enterprise":
        query = query.filter(CooperationProject.enterprise_id == current_user.id)
    elif current_user.role == "university":
        query = query.filter(CooperationProject.university_id == current_user.id)
    elif current_user.role == "government":
        # 政府用户统计所有项目
        pass
    else:
        return {"total": 0, "pending": 0, "signed": 0, "in_progress": 0, "completed": 0}

    total = query.count()
    pending_count = query.filter(CooperationProject.status == ProjectStatus.PENDING).count()
    signed_count = query.filter(CooperationProject.status == ProjectStatus.SIGNED).count()
    in_progress_count = query.filter(CooperationProject.status == ProjectStatus.IN_PROGRESS).count()
    completed_count = query.filter(CooperationProject.status == ProjectStatus.COMPLETED).count()

    return {
        "total": total,
        "pending": pending_count,
        "signed": signed_count,
        "in_progress": in_progress_count,
        "completed": completed_count
    }
