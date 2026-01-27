from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.resource import Resource, ResourceType
from ..schemas.resource import ResourceCreate, ResourceUpdate, ResourceResponse

router = APIRouter()


@router.get("", response_model=List[ResourceResponse])
async def get_resources(
    search: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Resource)

    if search:
        query = query.filter(
            (Resource.title.contains(search)) | (Resource.company.contains(search))
        )

    if type:
        query = query.filter(Resource.type == type)

    resources = query.order_by(Resource.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for resource in resources:
        res_dict = ResourceResponse.model_validate(resource).model_dump()
        res_dict["contact_id"] = resource.publisher_id
        result.append(ResourceResponse(**res_dict))

    return result


@router.get("/my", response_model=List[ResourceResponse])
async def get_my_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resources = db.query(Resource).filter(
        Resource.publisher_id == current_user.id
    ).order_by(Resource.created_at.desc()).all()

    result = []
    for resource in resources:
        res_dict = ResourceResponse.model_validate(resource).model_dump()
        res_dict["contact_id"] = current_user.id
        result.append(ResourceResponse(**res_dict))

    return result


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")

    res_dict = ResourceResponse.model_validate(resource).model_dump()
    res_dict["contact_id"] = resource.publisher_id

    return ResourceResponse(**res_dict)


@router.post("", response_model=ResourceResponse)
async def create_resource(
    resource_data: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.value != "enterprise":
        raise HTTPException(status_code=403, detail="只有企业用户可以发布资源")

    # 转换数据，处理枚举类型
    data = resource_data.model_dump()
    if data.get("type"):
        data["type"] = ResourceType(data["type"])

    resource = Resource(
        **data,
        publisher_id=current_user.id,
        company=current_user.company
    )

    db.add(resource)
    db.commit()
    db.refresh(resource)

    res_dict = ResourceResponse.model_validate(resource).model_dump()
    res_dict["contact_id"] = current_user.id

    return ResourceResponse(**res_dict)


@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    resource_id: int,
    resource_data: ResourceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")

    if resource.publisher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此资源")

    update_data = resource_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "type" and value:
            setattr(resource, field, ResourceType(value))
        else:
            setattr(resource, field, value)

    db.commit()
    db.refresh(resource)

    res_dict = ResourceResponse.model_validate(resource).model_dump()
    res_dict["contact_id"] = current_user.id

    return ResourceResponse(**res_dict)


@router.delete("/{resource_id}")
async def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")

    if resource.publisher_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此资源")

    db.delete(resource)
    db.commit()

    return {"message": "资源已删除"}
