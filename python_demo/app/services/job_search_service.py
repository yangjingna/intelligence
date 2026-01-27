# -*- coding: utf-8 -*-
"""
岗位搜索服务 - 供智能客服工具调用使用
"""
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from ..models.job import Job, JobStatus
from ..models.user import User
from ..core.database import SessionLocal


class JobSearchService:
    """岗位搜索服务"""

    def search_jobs(
        self,
        keywords: Optional[str] = None,
        skills: Optional[List[str]] = None,
        location: Optional[str] = None,
        experience: Optional[str] = None,
        company: Optional[str] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """搜索岗位

        Args:
            keywords: 关键词（搜索标题、描述、要求）
            skills: 技能列表（搜索标签和描述）
            location: 工作地点
            experience: 工作经验要求
            company: 公司名称
            limit: 返回数量限制

        Returns:
            岗位信息列表
        """
        db = SessionLocal()
        try:
            query = db.query(Job).filter(Job.status == JobStatus.ACTIVE)

            # 关键词搜索（标题、描述、要求）
            if keywords:
                keyword_filter = or_(
                    Job.title.contains(keywords),
                    Job.description.contains(keywords),
                    Job.requirements.contains(keywords),
                    Job.company.contains(keywords)
                )
                query = query.filter(keyword_filter)

            # 技能搜索
            if skills:
                skill_filters = []
                for skill in skills:
                    skill_lower = skill.lower()
                    skill_filters.append(
                        or_(
                            Job.title.ilike(f"%{skill}%"),
                            Job.description.ilike(f"%{skill}%"),
                            Job.requirements.ilike(f"%{skill}%")
                        )
                    )
                if skill_filters:
                    query = query.filter(or_(*skill_filters))

            # 地点筛选
            if location:
                query = query.filter(Job.location.contains(location))

            # 经验筛选
            if experience:
                query = query.filter(Job.experience.contains(experience))

            # 公司筛选
            if company:
                query = query.filter(Job.company.contains(company))

            # 排序和限制
            jobs = query.order_by(Job.created_at.desc()).limit(limit).all()

            # 转换为字典列表
            result = []
            for job in jobs:
                # 获取HR信息
                hr = db.query(User).filter(User.id == job.hr_id).first()
                result.append({
                    "id": job.id,
                    "title": job.title,
                    "company": job.company or (hr.company if hr else "未知公司"),
                    "salary": job.salary or "面议",
                    "location": job.location or "不限",
                    "experience": job.experience or "不限",
                    "education": job.education or "不限",
                    "description": job.description[:200] + "..." if job.description and len(job.description) > 200 else job.description,
                    "tags": job.tags or [],
                    "hr_name": hr.name if hr else None
                })

            return result
        finally:
            db.close()

    def search_by_company(self, company_name: str, limit: int = 5) -> Dict[str, Any]:
        """按公司名搜索岗位

        Args:
            company_name: 公司名称
            limit: 返回数量限制

        Returns:
            公司信息和岗位列表
        """
        db = SessionLocal()
        try:
            # 搜索包含公司名的岗位
            jobs = db.query(Job).filter(
                Job.status == JobStatus.ACTIVE,
                or_(
                    Job.company.contains(company_name),
                    Job.title.contains(company_name)
                )
            ).order_by(Job.created_at.desc()).limit(limit).all()

            if not jobs:
                return {
                    "found": False,
                    "company_name": company_name,
                    "message": f"未找到与「{company_name}」相关的岗位",
                    "jobs": []
                }

            # 获取公司信息
            company_info = jobs[0].company if jobs[0].company else company_name

            job_list = []
            for job in jobs:
                hr = db.query(User).filter(User.id == job.hr_id).first()
                job_list.append({
                    "id": job.id,
                    "title": job.title,
                    "salary": job.salary or "面议",
                    "location": job.location or "不限",
                    "experience": job.experience or "不限",
                    "tags": job.tags or []
                })

            return {
                "found": True,
                "company_name": company_info,
                "job_count": len(job_list),
                "jobs": job_list
            }
        finally:
            db.close()

    def get_job_recommendations(
        self,
        job_type: Optional[str] = None,
        location: Optional[str] = None,
        experience: Optional[str] = None,
        skills: Optional[List[str]] = None,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """根据用户画像推荐岗位

        Args:
            job_type: 意向岗位类型
            location: 意向工作地点
            experience: 工作经验
            skills: 技能列表
            limit: 返回数量限制

        Returns:
            推荐岗位列表
        """
        db = SessionLocal()
        try:
            query = db.query(Job).filter(Job.status == JobStatus.ACTIVE)

            # 根据岗位类型匹配
            if job_type:
                type_keywords = self._get_job_type_keywords(job_type)
                if type_keywords:
                    type_filters = [Job.title.ilike(f"%{kw}%") for kw in type_keywords]
                    query = query.filter(or_(*type_filters))

            # 地点匹配
            if location:
                query = query.filter(Job.location.contains(location))

            # 技能匹配
            if skills:
                skill_filters = []
                for skill in skills:
                    skill_filters.append(
                        or_(
                            Job.title.ilike(f"%{skill}%"),
                            Job.description.ilike(f"%{skill}%"),
                            Job.requirements.ilike(f"%{skill}%")
                        )
                    )
                if skill_filters:
                    query = query.filter(or_(*skill_filters))

            jobs = query.order_by(Job.created_at.desc()).limit(limit).all()

            result = []
            for job in jobs:
                hr = db.query(User).filter(User.id == job.hr_id).first()
                result.append({
                    "id": job.id,
                    "title": job.title,
                    "company": job.company or (hr.company if hr else "未知公司"),
                    "salary": job.salary or "面议",
                    "location": job.location or "不限",
                    "experience": job.experience or "不限",
                    "tags": job.tags or [],
                    "match_reason": self._get_match_reason(job, job_type, location, skills)
                })

            return result
        finally:
            db.close()

    def _get_job_type_keywords(self, job_type: str) -> List[str]:
        """获取岗位类型的搜索关键词"""
        type_mapping = {
            "前端开发": ["前端", "frontend", "vue", "react", "javascript", "web"],
            "后端开发": ["后端", "backend", "java", "python", "go", "服务端"],
            "算法工程师": ["算法", "机器学习", "深度学习", "ai", "人工智能", "nlp", "cv"],
            "数据分析": ["数据分析", "数据", "bi", "分析师"],
            "产品经理": ["产品", "产品经理", "pm"],
            "测试工程师": ["测试", "qa", "质量"],
            "嵌入式": ["嵌入式", "硬件", "单片机", "arm"],
            "UI设计": ["设计", "ui", "ux", "视觉"],
        }
        return type_mapping.get(job_type, [job_type])

    def _get_match_reason(
        self,
        job: Job,
        job_type: Optional[str],
        location: Optional[str],
        skills: Optional[List[str]]
    ) -> str:
        """生成匹配原因说明"""
        reasons = []

        if job_type and job_type.lower() in (job.title or "").lower():
            reasons.append(f"岗位类型匹配「{job_type}」")

        if location and location in (job.location or ""):
            reasons.append(f"工作地点在「{location}」")

        if skills:
            matched_skills = []
            job_text = f"{job.title} {job.description} {job.requirements}".lower()
            for skill in skills:
                if skill.lower() in job_text:
                    matched_skills.append(skill)
            if matched_skills:
                reasons.append(f"技能匹配「{', '.join(matched_skills)}」")

        return "；".join(reasons) if reasons else "综合推荐"

    def get_statistics(self) -> Dict[str, Any]:
        """获取平台岗位统计"""
        db = SessionLocal()
        try:
            total = db.query(Job).filter(Job.status == JobStatus.ACTIVE).count()

            # 按地点统计
            from sqlalchemy import func
            location_stats = db.query(
                Job.location,
                func.count(Job.id)
            ).filter(
                Job.status == JobStatus.ACTIVE,
                Job.location != None
            ).group_by(Job.location).all()

            return {
                "total_jobs": total,
                "locations": {loc: count for loc, count in location_stats if loc}
            }
        finally:
            db.close()


# 单例实例
job_search_service = JobSearchService()
