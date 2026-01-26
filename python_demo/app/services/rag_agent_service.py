# -*- coding: utf-8 -*-
"""
RAG 智能体服务
结合短时记忆（Redis）和长期记忆（MySQL）实现智能问答
"""
import httpx
from typing import Optional, List, Tuple
from ..core.config import settings
from ..core.redis_client import redis_client
from .sql_rag_service import sql_rag_service
from .embedding_service import embedding_service


class RAGAgentService:
    """RAG 智能体 - 基于知识库的智能问答"""

    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.GLM_API_URL
        self.max_context_messages = 6  # 短时记忆最大消息数

    async def get_intelligent_response(
        self,
        user_message: str,
        conversation_id: int,
        job_id: Optional[int] = None,
        job_context: Optional[str] = None
    ) -> Tuple[str, bool]:
        """获取智能体回复

        Args:
            user_message: 用户消息
            conversation_id: 会话ID
            job_id: 岗位ID（用于精准检索）
            job_context: 岗位信息上下文

        Returns:
            (回复内容, 是否使用了RAG知识库)
        """
        # 1. 获取短时记忆（最近对话）
        short_term_context = self._get_short_term_context(conversation_id)

        # 2. 获取长期记忆（RAG检索相关历史问答）
        rag_results = await self._search_knowledge_base(user_message, job_id)

        # 3. 构建智能提示词
        system_prompt = self._build_system_prompt(job_context, rag_results)

        # 4. 调用 LLM 生成回复
        response = await self._generate_response(
            system_prompt=system_prompt,
            short_term_context=short_term_context,
            user_message=user_message
        )

        # 5. 保存到短时记忆
        self._save_to_short_term(conversation_id, user_message, response)

        # 判断是否使用了 RAG
        used_rag = len(rag_results) > 0

        return response, used_rag

    def _get_short_term_context(self, conversation_id: int) -> List[dict]:
        """获取短时记忆上下文"""
        context = redis_client.get_chat_context(conversation_id)
        if context:
            return context[-self.max_context_messages:]
        return []

    def _save_to_short_term(
        self,
        conversation_id: int,
        user_message: str,
        assistant_response: str
    ):
        """保存对话到短时记忆"""
        redis_client.append_message(conversation_id, "user", user_message)
        redis_client.append_message(conversation_id, "assistant", assistant_response)

    async def _search_knowledge_base(
        self,
        query: str,
        job_id: Optional[int] = None
    ) -> List[dict]:
        """搜索知识库获取相关问答"""
        similar_pairs = await sql_rag_service.search_similar(query, job_id, n_results=5)

        results = []
        for question, answer, score in similar_pairs:
            results.append({
                "question": question,
                "answer": answer,
                "relevance": score
            })

        return results

    def _build_system_prompt(
        self,
        job_context: Optional[str],
        rag_results: List[dict]
    ) -> str:
        """构建系统提示词"""
        prompt_parts = [
            "你是一个专业的企业HR智能助手，负责在HR离线时智能回复求职者的问题。",
            "",
            "## 你的职责",
            "1. 根据知识库中的历史问答，准确回答求职者的问题",
            "2. 保持回复的专业性和一致性",
            "3. 如果知识库中有相关答案，优先参考知识库内容",
            "4. 如果问题超出知识范围，礼貌地建议等待HR上线",
            "",
            "## 回复要求",
            "- 回复要简洁、专业、友好",
            "- 如果引用知识库内容，保持答案的一致性",
            "- 适当结合上下文进行连贯的对话",
            "- 不要编造信息，如不确定请如实告知",
        ]

        # 添加岗位信息
        if job_context:
            prompt_parts.extend([
                "",
                "## 当前岗位信息",
                job_context
            ])

        # 添加知识库参考
        if rag_results:
            prompt_parts.extend([
                "",
                "## 知识库参考（历史问答）",
                "以下是与当前问题相关的历史问答记录，请参考这些内容回答：",
                ""
            ])

            for i, result in enumerate(rag_results[:3], 1):
                prompt_parts.extend([
                    f"### 参考 {i}（相关度：{result['relevance']:.2f}）",
                    f"**问题**：{result['question']}",
                    f"**回答**：{result['answer']}",
                    ""
                ])

            prompt_parts.extend([
                "请根据以上参考信息，结合当前对话上下文，为用户提供准确的回答。",
                "如果参考信息与用户问题高度相关，请直接采用或适当调整参考答案。"
            ])
        else:
            prompt_parts.extend([
                "",
                "## 注意",
                "当前知识库中没有找到直接相关的历史问答。",
                "请根据岗位信息和通用知识进行回答，或建议用户等待HR上线获取更准确的信息。"
            ])

        return "\n".join(prompt_parts)

    async def _generate_response(
        self,
        system_prompt: str,
        short_term_context: List[dict],
        user_message: str
    ) -> str:
        """调用 LLM 生成回复"""
        try:
            # 构建消息列表
            messages = [{"role": "system", "content": system_prompt}]

            # 添加短时记忆（对话历史）
            for msg in short_term_context:
                messages.append(msg)

            # 添加当前用户消息
            messages.append({"role": "user", "content": user_message})

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "glm-4",
                        "messages": messages,
                        "temperature": 0.7,
                        "max_tokens": 800
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]

        except Exception as e:
            print(f"RAG Agent Error: {e}")
            return self._get_fallback_response()

    def _get_fallback_response(self) -> str:
        """降级回复"""
        return (
            "感谢您的咨询！HR当前不在线，您的消息已收到。\n\n"
            "您的问题我已记录，HR上线后会第一时间查看并回复您。\n"
            "如有紧急问题，您也可以通过平台智能客服获取帮助。"
        )

    async def index_hr_answer(
        self,
        question: str,
        answer: str,
        job_id: Optional[int] = None,
        hr_id: Optional[int] = None,
        conversation_id: Optional[int] = None
    ) -> bool:
        """将 HR 的回答索引到知识库

        当 HR 回复学生问题时调用，将问答对存入知识库
        """
        return await sql_rag_service.index_qa_pair(
            question=question,
            answer=answer,
            job_id=job_id,
            hr_id=hr_id,
            conversation_id=conversation_id
        )


# 单例实例
rag_agent = RAGAgentService()
