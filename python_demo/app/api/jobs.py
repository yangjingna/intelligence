from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.job import Job, JobStatus
from ..schemas.job import JobCreate, JobUpdate, JobResponse
from ..services.websocket_manager import ws_manager

router = APIRouter()


@router.get("", response_model=List[JobResponse])
async def get_jobs(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Job).filter(Job.status == JobStatus.ACTIVE)

    if search:
        query = query.filter(
            (Job.title.contains(search)) | (Job.company.contains(search))
        )

    if location:
        query = query.filter(Job.location == location)

    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for job in jobs:
        hr = db.query(User).filter(User.id == job.hr_id).first()
        job_dict = JobResponse.model_validate(job).model_dump()
        job_dict["hr_name"] = hr.name if hr else None
        job_dict["hr_online"] = ws_manager.is_user_online(job.hr_id)
        result.append(JobResponse(**job_dict))

    return result


@router.get("/my", response_model=List[JobResponse])
async def get_my_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    jobs = db.query(Job).filter(Job.hr_id == current_user.id).order_by(Job.created_at.desc()).all()

    result = []
    for job in jobs:
        job_dict = JobResponse.model_validate(job).model_dump()
        job_dict["hr_name"] = current_user.name
        job_dict["hr_online"] = ws_manager.is_user_online(current_user.id)
        result.append(JobResponse(**job_dict))

    return result


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")

    hr = db.query(User).filter(User.id == job.hr_id).first()
    job_dict = JobResponse.model_validate(job).model_dump()
    job_dict["hr_name"] = hr.name if hr else None
    job_dict["hr_online"] = ws_manager.is_user_online(job.hr_id)

    return JobResponse(**job_dict)


@router.post("", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "enterprise":
        raise HTTPException(status_code=403, detail="只有企业用户可以发布岗位")

    job = Job(
        **job_data.model_dump(),
        hr_id=current_user.id,
        company=current_user.company
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    job_dict = JobResponse.model_validate(job).model_dump()
    job_dict["hr_name"] = current_user.name
    job_dict["hr_online"] = True

    return JobResponse(**job_dict)


@router.put("/{job_id}", response_model=JobResponse)
async def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")

    if job.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此岗位")

    update_data = job_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(job, field, JobStatus(value))
        else:
            setattr(job, field, value)

    db.commit()
    db.refresh(job)

    job_dict = JobResponse.model_validate(job).model_dump()
    job_dict["hr_name"] = current_user.name
    job_dict["hr_online"] = True

    return JobResponse(**job_dict)


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="岗位不存在")

    if job.hr_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此岗位")

    db.delete(job)
    db.commit()

    return {"message": "岗位已删除"}
