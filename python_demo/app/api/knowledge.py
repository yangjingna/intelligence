# -*- coding: utf-8 -*-
"""
知识库管理 API 端点
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional, List
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.user import User
from ..models.knowledge import CustomerServiceKnowledge
from ..schemas.knowledge import (
    KnowledgeCreate,
    KnowledgeUpdate,
    KnowledgeResponse,
    KnowledgeListResponse,
    KnowledgeStats,
    TopHitQuestion
)
from ..services.embedding_service import embedding_service

router = APIRouter()


def check_enterprise_user(user: User):
    """检查是否为企业用户"""
    if user.role != "enterprise":
        raise HTTPException(status_code=403, detail="仅企业用户可访问知识库管理")


@router.get("", response_model=KnowledgeListResponse)
async def get_knowledge_list(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
    search: Optional[str] = Query(None, description="搜索关键词"),
    category: Optional[str] = Query(None, description="分类筛选"),
    is_preset: Optional[int] = Query(None, description="是否预设: 0-否, 1-是"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取知识库列表（支持分页、搜索、分类筛选）"""
    check_enterprise_user(current_user)

    query = db.query(CustomerServiceKnowledge)

    # 搜索筛选
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                CustomerServiceKnowledge.question.like(search_pattern),
                CustomerServiceKnowledge.answer.like(search_pattern),
                CustomerServiceKnowledge.keywords.like(search_pattern)
            )
        )

    # 分类筛选
    if category:
        query = query.filter(CustomerServiceKnowledge.category == category)

    # 预设筛选
    if is_preset is not None:
        query = query.filter(CustomerServiceKnowledge.is_preset == is_preset)

    # 计算总数
    total = query.count()

    # 分页查询
    items = query.order_by(CustomerServiceKnowledge.created_at.desc()) \
        .offset((page - 1) * page_size) \
        .limit(page_size) \
        .all()

    return KnowledgeListResponse(
        items=[KnowledgeResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/stats", response_model=KnowledgeStats)
async def get_knowledge_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取知识库统计信息"""
    check_enterprise_user(current_user)

    # 总数
    total_records = db.query(CustomerServiceKnowledge).count()

    # 预设数量
    preset_count = db.query(CustomerServiceKnowledge) \
        .filter(CustomerServiceKnowledge.is_preset == 1).count()

    # 学习数量
    learned_count = db.query(CustomerServiceKnowledge) \
        .filter(CustomerServiceKnowledge.is_preset == 0).count()

    # 热门问题（按命中次数排序，取前5个）
    top_questions = db.query(CustomerServiceKnowledge) \
        .filter(CustomerServiceKnowledge.hit_count > 0) \
        .order_by(CustomerServiceKnowledge.hit_count.desc()) \
        .limit(5) \
        .all()

    return KnowledgeStats(
        total_records=total_records,
        preset_count=preset_count,
        learned_count=learned_count,
        top_hit_questions=[
            TopHitQuestion(
                id=q.id,
                question=q.question[:50] + "..." if len(q.question) > 50 else q.question,
                hit_count=q.hit_count
            ) for q in top_questions
        ]
    )


@router.get("/categories", response_model=List[str])
async def get_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取所有分类列表"""
    check_enterprise_user(current_user)

    # 预定义分类
    preset_categories = ["平台功能", "注册登录", "岗位招聘", "资源中心", "其他"]

    # 获取数据库中已使用的分类
    db_categories = db.query(CustomerServiceKnowledge.category) \
        .filter(CustomerServiceKnowledge.category.isnot(None)) \
        .distinct() \
        .all()

    db_category_list = [c[0] for c in db_categories if c[0]]

    # 合并并去重
    all_categories = list(set(preset_categories + db_category_list))

    return sorted(all_categories)


@router.get("/{knowledge_id}", response_model=KnowledgeResponse)
async def get_knowledge_item(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个知识条目"""
    check_enterprise_user(current_user)

    item = db.query(CustomerServiceKnowledge).filter(
        CustomerServiceKnowledge.id == knowledge_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="知识条目不存在")

    return KnowledgeResponse.model_validate(item)


@router.post("", response_model=KnowledgeResponse)
async def create_knowledge(
    data: KnowledgeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建知识条目（自动生成embedding）"""
    check_enterprise_user(current_user)

    # 生成embedding
    embedding = await embedding_service.get_embedding(data.question)

    # 创建知识条目
    item = CustomerServiceKnowledge(
        question=data.question,
        answer=data.answer,
        category=data.category,
        keywords=data.keywords,
        is_preset=1 if data.is_preset else 0,
        embedding=embedding,
        hit_count=0
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return KnowledgeResponse.model_validate(item)


@router.put("/{knowledge_id}", response_model=KnowledgeResponse)
async def update_knowledge(
    knowledge_id: int,
    data: KnowledgeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新知识条目（如果问题改变则重新生成embedding）"""
    check_enterprise_user(current_user)

    item = db.query(CustomerServiceKnowledge).filter(
        CustomerServiceKnowledge.id == knowledge_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="知识条目不存在")

    # 更新字段
    update_data = data.model_dump(exclude_unset=True)

    # 如果问题改变，重新生成embedding
    if "question" in update_data and update_data["question"] != item.question:
        embedding = await embedding_service.get_embedding(update_data["question"])
        item.embedding = embedding

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return KnowledgeResponse.model_validate(item)


@router.delete("/{knowledge_id}")
async def delete_knowledge(
    knowledge_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除知识条目"""
    check_enterprise_user(current_user)

    item = db.query(CustomerServiceKnowledge).filter(
        CustomerServiceKnowledge.id == knowledge_id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="知识条目不存在")

    db.delete(item)
    db.commit()

    return {"message": "知识条目已删除"}
