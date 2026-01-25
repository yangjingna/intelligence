# -*- coding: utf-8 -*-
import httpx
import json
from typing import List, Optional
from ..core.config import settings


class SummaryService:
    """会话智能总结服务"""

    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.GLM_API_URL

    async def summarize_conversation(
        self,
        messages: List[dict],
        job_title: Optional[str] = None,
        student_name: Optional[str] = None,
        hr_name: Optional[str] = None
    ) -> dict:
        """生成会话总结

        Returns:
            {
                "summary": "总结内容",
                "key_points": ["要点1", "要点2", ...],
                "user_interests": ["用户关注点1", "用户关注点2", ...],
                "suggested_actions": ["建议行动1", "建议行动2", ...]
            }
        """
        if not messages:
            return {
                "summary": "暂无对话记录",
                "key_points": [],
                "user_interests": [],
                "suggested_actions": []
            }

        # 构建对话内容
        conversation_text = self._format_messages(messages, student_name, hr_name)

        # 构建 System Prompt
        system_prompt = """你是一个专业的对话分析助手。请根据提供的求职沟通记录，生成结构化的智能总结。

请严格按照以下JSON格式返回，不要添加任何其他内容：
{
    "summary": "一段简洁的对话总结（100-200字）",
    "key_points": ["讨论的关键要点1", "关键要点2", "关键要点3"],
    "user_interests": ["用户关注的问题或话题1", "关注点2"],
    "suggested_actions": ["基于对话的建议后续行动1", "建议2"]
}

分析要求：
1. summary：概括对话的主要内容和进展
2. key_points：提取3-5个重要讨论点
3. user_interests：识别用户（求职者）最关心的2-4个方面
4. suggested_actions：给出2-3个合理的后续建议"""

        # 构建用户消息
        user_message = f"请分析以下求职沟通记录"
        if job_title:
            user_message += f"（关于岗位：{job_title}）"
        user_message += f"：\n\n{conversation_text}"

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "glm-4",
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1000
                    },
                    timeout=60.0
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # 解析 JSON 响应
                return self._parse_summary_response(content)
        except Exception as e:
            print(f"Summary Service Error: {e}")
            return self._get_fallback_summary(messages)

    def _format_messages(
        self,
        messages: List[dict],
        student_name: Optional[str] = None,
        hr_name: Optional[str] = None
    ) -> str:
        """格式化消息列表为文本"""
        formatted = []
        for msg in messages:
            msg_type = msg.get("type", "text")
            content = msg.get("content", "")
            sender_id = msg.get("sender_id")

            # 根据消息类型确定角色
            if msg_type == "ai_response":
                role = "AI助手"
            elif hr_name and msg.get("is_hr"):
                role = hr_name
            elif student_name and not msg.get("is_hr"):
                role = student_name
            else:
                role = "HR" if msg.get("is_hr") else "求职者"

            formatted.append(f"{role}：{content}")

        return "\n".join(formatted)

    def _parse_summary_response(self, content: str) -> dict:
        """解析 LLM 返回的 JSON 响应"""
        try:
            # 尝试直接解析
            return json.loads(content)
        except json.JSONDecodeError:
            # 尝试提取 JSON 部分
            import re
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except json.JSONDecodeError:
                    pass

        # 解析失败，返回默认结构
        return {
            "summary": content[:500] if content else "无法生成总结",
            "key_points": [],
            "user_interests": [],
            "suggested_actions": []
        }

    def _get_fallback_summary(self, messages: List[dict]) -> dict:
        """生成后备总结"""
        msg_count = len(messages)
        return {
            "summary": f"该会话共包含 {msg_count} 条消息。由于技术原因，暂时无法生成智能总结。",
            "key_points": ["会话记录已保存"],
            "user_interests": [],
            "suggested_actions": ["稍后再试", "查看完整聊天记录"]
        }


# 单例实例
summary_service = SummaryService()
