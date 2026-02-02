from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.inquiry_record import InquiryRecord, InquiryStatus
from ..schemas.inquiry_record import (
    InquiryRecordCreate,
    InquiryRecordUpdate,
    InquiryRecordResponse
)
from ..services.websocket_manager import ws_manager
from datetime import datetime

router = APIRouter()


@router.get("", response_model=List[InquiryRecordResponse])
async def get_inquiry_records(
    search: Optional[str] = Query(None),
    inquiry_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取咨询记录列表"""
    query = db.query(InquiryRecord)

    # 只能看到自己发起的咨询或发给自己的咨询
    query = query.filter(
        (InquiryRecord.inquirer_id == current_user.id) |
        (InquiryRecord.target_user_id == current_user.id)
    )

    if search:
        query = query.filter(
            (InquiryRecord.subject.contains(search)) |
            (InquiryRecord.content.contains(search))
        )

    if inquiry_type:
        query = query.filter(InquiryRecord.inquiry_type == inquiry_type)

    if status:
        query = query.filter(InquiryRecord.status == InquiryStatus(status))

    records = query.order_by(InquiryRecord.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for record in records:
        record_dict = InquiryRecordResponse.model_validate(record).model_dump()
        # 增加浏览次数
        if record.target_user_id == current_user.id:
            record.view_count += 1
            db.commit()
        result.append(InquiryRecordResponse(**record_dict))

    return result


@router.get("/{inquiry_id}", response_model=InquiryRecordResponse)
async def get_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个咨询记录详情"""
    record = db.query(InquiryRecord).filter(InquiryRecord.id == inquiry_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="咨询记录不存在")

    # 权限检查
    if record.inquirer_id != current_user.id and record.target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此咨询记录")

    record_dict = InquiryRecordResponse.model_validate(record).model_dump()
    return InquiryRecordResponse(**record_dict)


@router.post("", response_model=InquiryRecordResponse)
async def create_inquiry(
    inquiry_data: InquiryRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """发起咨询"""
    # 检查目标用户是否存在
    target_user = db.query(User).filter(User.id == inquiry_data.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="目标用户不存在")

    record = InquiryRecord(
        **inquiry_data.model_dump(),
        inquirer_id=current_user.id,
        inquirer_name=current_user.name,
        inquirer_role=current_user.role
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # 通知目标用户
    await ws_manager.send_inquiry_notification(record)

    record_dict = InquiryRecordResponse.model_validate(record).model_dump()
    return InquiryRecordResponse(**record_dict)


@router.put("/{inquiry_id}", response_model=InquiryRecordResponse)
async def update_inquiry(
    inquiry_id: int,
    inquiry_data: InquiryRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """回复咨询"""
    record = db.query(InquiryRecord).filter(InquiryRecord.id == inquiry_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="咨询记录不存在")

    # 只有被咨询者可以回复
    if record.target_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权回复此咨询")

    update_data = inquiry_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value:
            setattr(record, field, InquiryStatus(value))
            if InquiryStatus(value) in [InquiryStatus.RESPONDED, InquiryStatus.RESOLVED]:
                record.responded_at = datetime.now()
        else:
            setattr(record, field, value)

    db.commit()
    db.refresh(record)

    record_dict = InquiryRecordResponse.model_validate(record).model_dump()
    return InquiryRecordResponse(**record_dict)


@router.delete("/{inquiry_id}")
async def delete_inquiry(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除咨询记录"""
    record = db.query(InquiryRecord).filter(InquiryRecord.id == inquiry_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="咨询记录不存在")

    # 只有发起者可以删除
    if record.inquirer_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此咨询记录")

    db.delete(record)
    db.commit()

    return {"message": "咨询记录已删除"}


@router.get("/stats/summary")
async def get_inquiry_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取咨询统计"""
    # 发起的咨询
    sent_query = db.query(InquiryRecord).filter(InquiryRecord.inquirer_id == current_user.id)
    sent_total = sent_query.count()
    sent_pending = sent_query.filter(InquiryRecord.status == InquiryStatus.PENDING).count()
    sent_resolved = sent_query.filter(InquiryRecord.status == InquiryStatus.RESOLVED).count()

    # 收到的咨询
    received_query = db.query(InquiryRecord).filter(InquiryRecord.target_user_id == current_user.id)
    received_total = received_query.count()
    received_pending = received_query.filter(InquiryRecord.status == InquiryStatus.PENDING).count()

    return {
        "sent_total": sent_total,
        "sent_pending": sent_pending,
        "sent_resolved": sent_resolved,
        "received_total": received_total,
        "received_pending": received_pending
    }
