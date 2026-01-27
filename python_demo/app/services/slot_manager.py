# -*- coding: utf-8 -*-
"""
槽位管理服务 - 管理对话状态和槽位填充
支持多轮对话理解、槽位填充、上下文状态保持
"""
import json
import re
from typing import Optional, Dict, List, Any
from datetime import datetime
from ..core.redis_client import redis_client
from ..core.database import SessionLocal


class SlotManager:
    """槽位管理器 - 管理用户对话状态和槽位信息"""

    # 技能关键词库
    SKILL_KEYWORDS = {
        # AI/机器学习相关
        "ai": ["ai", "人工智能", "artificial intelligence"],
        "机器学习": ["机器学习", "ml", "machine learning"],
        "深度学习": ["深度学习", "dl", "deep learning"],
        "nlp": ["nlp", "自然语言处理", "自然语言"],
        "cv": ["cv", "计算机视觉", "图像识别"],
        "pytorch": ["pytorch", "torch"],
        "tensorflow": ["tensorflow", "tf"],

        # 编程语言
        "python": ["python", "py"],
        "java": ["java"],
        "javascript": ["javascript", "js", "es6"],
        "typescript": ["typescript", "ts"],
        "golang": ["golang", "go语言"],
        "c++": ["c++", "cpp"],
        "rust": ["rust"],

        # 前端技术
        "react": ["react", "reactjs"],
        "vue": ["vue", "vuejs", "vue.js"],
        "angular": ["angular"],
        "前端": ["前端", "frontend", "web前端"],

        # 后端技术
        "后端": ["后端", "backend", "服务端"],
        "spring": ["spring", "springboot"],
        "django": ["django"],
        "fastapi": ["fastapi"],
        "nodejs": ["nodejs", "node.js", "node"],

        # 数据库
        "mysql": ["mysql"],
        "postgresql": ["postgresql", "postgres"],
        "mongodb": ["mongodb", "mongo"],
        "redis": ["redis"],

        # 云和运维
        "docker": ["docker", "容器"],
        "kubernetes": ["kubernetes", "k8s"],
        "aws": ["aws", "亚马逊云"],
        "linux": ["linux"],

        # 数据分析
        "数据分析": ["数据分析", "data analysis"],
        "sql": ["sql"],
        "tableau": ["tableau"],
        "pandas": ["pandas"],
    }

    # 定义槽位结构
    SLOT_DEFINITIONS = {
        "user_intent": {
            "description": "用户意图",
            "possible_values": ["找工作", "了解平台", "咨询问题", "发布岗位", "发布资源", "其他"],
            "keywords": {
                "找工作": ["找工作", "求职", "推荐岗位", "招聘", "实习", "工作机会", "就业", "推荐", "帮我找"],
                "了解平台": ["平台", "功能", "怎么用", "介绍", "是什么"],
                "咨询问题": ["怎么", "如何", "为什么", "问题", "帮助"],
                "发布岗位": ["发布岗位", "招人", "招聘信息"],
                "发布资源": ["发布资源", "合作", "项目"],
            }
        },
        "job_type": {
            "description": "意向岗位类型",
            "possible_values": ["前端开发", "后端开发", "算法工程师", "数据分析", "产品经理", "测试工程师", "嵌入式", "UI设计", "其他"],
            "keywords": {
                "前端开发": ["前端", "vue", "react", "javascript", "js", "html", "css", "web前端"],
                "后端开发": ["后端", "java", "python", "go", "php", "服务端", "服务器"],
                "算法工程师": ["算法", "机器学习", "深度学习", "ai", "人工智能", "nlp", "cv"],
                "数据分析": ["数据分析", "数据", "bi", "tableau", "sql"],
                "产品经理": ["产品", "产品经理", "pm", "需求"],
                "测试工程师": ["测试", "qa", "质量"],
                "嵌入式": ["嵌入式", "硬件", "单片机", "arm", "c语言"],
                "UI设计": ["设计", "ui", "ux", "美工", "视觉"],
            }
        },
        "location": {
            "description": "意向工作地点",
            "possible_values": ["北京", "上海", "深圳", "杭州", "广州", "成都", "武汉", "南京", "其他"],
            "keywords": {
                "北京": ["北京", "帝都"],
                "上海": ["上海", "魔都"],
                "深圳": ["深圳"],
                "杭州": ["杭州"],
                "广州": ["广州"],
                "成都": ["成都"],
                "武汉": ["武汉"],
                "南京": ["南京"],
            }
        },
        "experience": {
            "description": "工作经验",
            "possible_values": ["应届生", "1-3年", "3-5年", "5年以上"],
            "keywords": {
                "应届生": ["应届", "毕业生", "实习", "在校", "学生", "大四", "研三"],
                "1-3年": ["1年", "2年", "3年", "一年", "两年", "三年"],
                "3-5年": ["4年", "5年", "四年", "五年"],
                "5年以上": ["5年以上", "资深", "高级"],
            }
        },
        "major": {
            "description": "专业背景",
            "possible_values": ["计算机", "软件工程", "电子信息", "通信", "数学", "物理", "金融", "管理", "其他"],
            "keywords": {
                "计算机": ["计算机", "cs", "计科"],
                "软件工程": ["软件", "软工"],
                "电子信息": ["电子", "电信", "电气"],
                "通信": ["通信", "通讯"],
                "数学": ["数学", "统计", "应数"],
                "物理": ["物理"],
                "金融": ["金融", "经济", "财务"],
                "管理": ["管理", "工商", "mba"],
            }
        },
        "salary_expectation": {
            "description": "薪资期望",
            "possible_values": ["10k以下", "10-15k", "15-20k", "20-30k", "30k以上"],
            "keywords": {
                "10k以下": ["10k以下", "1万以下", "8k", "9k"],
                "10-15k": ["10k", "12k", "15k", "1万", "1.2万", "1.5万"],
                "15-20k": ["18k", "20k", "1.8万", "2万"],
                "20-30k": ["25k", "30k", "2.5万", "3万"],
                "30k以上": ["30k以上", "3万以上", "高薪"],
            }
        }
    }

    def __init__(self):
        self.ttl = 3600  # 槽位信息过期时间（1小时）

    def _get_slot_key(self, user_id: int) -> str:
        """生成槽位存储的Redis key"""
        return f"customer_service:slots:{user_id}"

    def _get_state_key(self, user_id: int) -> str:
        """生成对话状态的Redis key"""
        return f"customer_service:state:{user_id}"

    def get_slots(self, user_id: int) -> Dict[str, Any]:
        """获取用户的槽位信息"""
        if redis_client.is_connected:
            try:
                key = self._get_slot_key(user_id)
                data = redis_client._client.get(key)
                if data:
                    return json.loads(data)
            except Exception as e:
                print(f"[SLOT] 获取槽位失败: {e}")

        # 返回默认槽位结构
        return self._get_default_slots()

    def _get_default_slots(self) -> Dict[str, Any]:
        """获取默认槽位结构"""
        return {
            "user_intent": None,
            "job_type": None,
            "location": None,
            "experience": None,
            "major": None,
            "salary_expectation": None,
            "skills": [],  # 用户技能列表
            "collected_info": [],  # 已收集的信息列表
            "last_topic": None,  # 上一个话题
            "turn_count": 0,  # 对话轮数
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }

    def save_slots(self, user_id: int, slots: Dict[str, Any]) -> bool:
        """保存用户的槽位信息"""
        if not redis_client.is_connected:
            return False

        try:
            slots["updated_at"] = datetime.now().isoformat()
            key = self._get_slot_key(user_id)
            redis_client._client.setex(key, self.ttl, json.dumps(slots, ensure_ascii=False))
            return True
        except Exception as e:
            print(f"[SLOT] 保存槽位失败: {e}")
            return False

    def extract_slots_from_message(self, message: str, current_slots: Dict[str, Any]) -> Dict[str, Any]:
        """从用户消息中提取槽位信息"""
        message_lower = message.lower()
        updated_slots = current_slots.copy()
        newly_filled = []

        for slot_name, slot_def in self.SLOT_DEFINITIONS.items():
            if slot_name == "user_intent" or current_slots.get(slot_name) is not None:
                # 意图每次都检测，其他已填充的槽位跳过
                if slot_name != "user_intent" and current_slots.get(slot_name) is not None:
                    continue

            keywords = slot_def.get("keywords", {})
            for value, kw_list in keywords.items():
                for kw in kw_list:
                    if kw.lower() in message_lower:
                        if current_slots.get(slot_name) != value:
                            updated_slots[slot_name] = value
                            if slot_name != "user_intent":
                                newly_filled.append(f"{slot_def['description']}: {value}")
                        break
                if updated_slots.get(slot_name) == value:
                    break

        # 提取用户技能
        extracted_skills = self._extract_skills(message)
        if extracted_skills:
            current_skills = updated_slots.get("skills", [])
            # 合并并去重
            all_skills = list(set(current_skills + extracted_skills))
            if all_skills != current_skills:
                updated_slots["skills"] = all_skills
                newly_filled.append(f"技能: {', '.join(extracted_skills)}")
                print(f"[SLOT] 提取到技能: {extracted_skills}")

        # 更新已收集的信息
        if newly_filled:
            updated_slots["collected_info"] = list(set(
                updated_slots.get("collected_info", []) + newly_filled
            ))

        # 更新对话轮数
        updated_slots["turn_count"] = current_slots.get("turn_count", 0) + 1

        return updated_slots

    def _extract_skills(self, message: str) -> List[str]:
        """从消息中提取技能关键词"""
        message_lower = message.lower()
        found_skills = []

        # 检测"精通"、"擅长"、"熟悉"等技能相关表达
        skill_indicators = ["精通", "擅长", "熟悉", "掌握", "会", "懂", "做过", "经验"]
        has_skill_context = any(ind in message for ind in skill_indicators)

        for skill_name, keywords in self.SKILL_KEYWORDS.items():
            for kw in keywords:
                if kw.lower() in message_lower:
                    # 如果消息中有技能相关表达，或者关键词足够明确
                    if has_skill_context or len(kw) >= 3:
                        found_skills.append(skill_name)
                        break

        return found_skills

    def get_conversation_state(self, user_id: int) -> Dict[str, Any]:
        """获取对话状态"""
        slots = self.get_slots(user_id)

        # 计算槽位填充率
        filled_count = sum(1 for k, v in slots.items()
                         if k in self.SLOT_DEFINITIONS and v is not None)
        total_slots = len(self.SLOT_DEFINITIONS)
        fill_rate = filled_count / total_slots

        # 确定对话阶段
        if slots.get("turn_count", 0) <= 1:
            stage = "greeting"  # 问候阶段
        elif slots.get("user_intent") == "找工作":
            if fill_rate < 0.3:
                stage = "collecting_basic"  # 收集基本信息
            elif fill_rate < 0.6:
                stage = "collecting_detail"  # 收集详细信息
            else:
                stage = "recommendation"  # 可以推荐
        else:
            stage = "qa"  # 问答阶段

        return {
            "slots": slots,
            "stage": stage,
            "fill_rate": fill_rate,
            "filled_count": filled_count,
            "total_slots": total_slots
        }

    def build_slot_context(self, slots: Dict[str, Any]) -> str:
        """构建槽位上下文字符串，用于AI提示"""
        context_parts = []

        # 用户意图
        if slots.get("user_intent"):
            context_parts.append(f"用户意图：{slots['user_intent']}")

        # 用户技能
        if slots.get("skills"):
            context_parts.append(f"用户技能：{', '.join(slots['skills'])}")

        # 已收集的用户信息
        user_info = []
        if slots.get("major"):
            user_info.append(f"专业背景：{slots['major']}")
        if slots.get("job_type"):
            user_info.append(f"意向岗位：{slots['job_type']}")
        if slots.get("location"):
            user_info.append(f"意向地点：{slots['location']}")
        if slots.get("experience"):
            user_info.append(f"工作经验：{slots['experience']}")
        if slots.get("salary_expectation"):
            user_info.append(f"薪资期望：{slots['salary_expectation']}")

        if user_info:
            context_parts.append("已了解的用户信息：\n- " + "\n- ".join(user_info))

        # 待收集的信息
        missing = []
        if slots.get("user_intent") == "找工作":
            if not slots.get("job_type"):
                missing.append("意向岗位类型")
            if not slots.get("location"):
                missing.append("意向工作地点")
            if not slots.get("experience"):
                missing.append("工作经验")

        if missing:
            context_parts.append(f"待了解的信息：{', '.join(missing)}")

        # 对话轮数
        turn_count = slots.get("turn_count", 0)
        if turn_count > 0:
            context_parts.append(f"当前是第 {turn_count} 轮对话")

        return "\n".join(context_parts) if context_parts else ""

    def get_follow_up_question(self, slots: Dict[str, Any]) -> Optional[str]:
        """根据槽位状态生成跟进问题"""
        if slots.get("user_intent") != "找工作":
            return None

        # 按优先级检查缺失的槽位
        if not slots.get("job_type"):
            return "请问您想找什么类型的岗位呢？比如前端开发、后端开发、算法、产品经理等？"
        if not slots.get("location"):
            return "请问您期望在哪个城市工作呢？"
        if not slots.get("experience"):
            return "请问您目前的工作经验是怎样的？是应届生还是有工作经验？"

        return None

    def clear_slots(self, user_id: int) -> bool:
        """清除用户的槽位信息"""
        if not redis_client.is_connected:
            return False

        try:
            key = self._get_slot_key(user_id)
            redis_client._client.delete(key)
            return True
        except Exception as e:
            print(f"[SLOT] 清除槽位失败: {e}")
            return False


# 单例实例
slot_manager = SlotManager()
