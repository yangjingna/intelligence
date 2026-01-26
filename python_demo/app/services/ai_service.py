# -*- coding: utf-8 -*-
import httpx
from typing import Optional, List
from ..core.config import settings
from .sql_rag_service import sql_rag_service
from .memory_service import memory_service
from .customer_service_memory import customer_service_memory


class AIService:
    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.GLM_API_URL

    async def get_chat_response(self, message: str, context: Optional[str] = None) -> str:
        system_prompt = (
            "你是一个企业HR助手，负责在HR离线时自动回复求职者的问题。"
            "请根据提供的岗位信息和公司信息，礼貌且专业地回答求职者的问题。"
            "如果问题超出你的知识范围，请建议求职者等待HR上线后再详细咨询。"
        )

        if context:
            system_prompt += f"\n\n相关信息：{context}"

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
                            {"role": "user", "content": message}
                        ],
                        "temperature": 0.7,
                        "max_tokens": 500
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"AI Service Error: {e}")
            return self._get_fallback_response(message)

    async def get_customer_service_response(self, message: str, chat_history: list = None) -> str:
        system_prompt = """你是产学研智能交互平台的智能客服助手，名叫"小智"。

## 平台简介
产学研智能交互平台是一个连接高校学生、科研人员和企业的综合性服务平台。平台旨在促进产学研深度融合，帮助学生找到实习和就业机会，帮助企业对接优质人才和科研资源。

## 平台主要功能
1. **岗位招聘**：企业可以发布岗位信息，学生可以浏览岗位并与HR直接沟通
2. **实时聊天**：学生和HR可以在线实时交流，HR离线时智能助手会自动回复
3. **资源中心**：企业可以发布产学研合作资源（项目合作、实习机会、科研项目、产学研合作）
4. **智能客服**：7x24小时在线解答用户问题
5. **个人中心**：管理个人信息和历史记录

## 用户类型
- **学生用户**：可以浏览岗位、查看资源、与企业HR沟通。学生界面中"资源发布"显示为"资源匹配"
- **企业用户**：可以发布岗位、发布资源、管理招聘流程。企业界面中显示为"资源发布"

## 使用指南

### 注册登录
- 注册：点击首页右上角"注册"按钮，选择用户类型（学生/企业），填写信息即可
- 登录：使用注册的邮箱和密码登录
- 密码找回：如忘记密码，请联系平台管理员

### 岗位功能
- **学生浏览岗位**：进入"岗位招聘"页面查看所有岗位，支持按关键词、地区搜索
- **学生联系HR**：在岗位列表点击"立即沟通"按钮，即可与该岗位的HR聊天
- **企业发布岗位**：登录后进入"岗位招聘"页面，点击"发布岗位"按钮
- **企业管理岗位**：可以编辑、删除已发布的岗位

### 资源功能
- **学生资源匹配**：进入"资源匹配"页面浏览产学研资源，点击"立即沟通"与企业联系
- **企业资源发布**：进入"资源发布"页面，点击"发布资源"按钮，选择资源类型并填写详情
- **资源类型**：项目合作、实习机会、科研项目、产学研合作

### 聊天功能
- 点击岗位或资源的"立即沟通"进入聊天界面
- 绿色圆点表示对方在线，灰色表示离线
- 对方离线时，智能助手会自动回复
- HR上线后可以查看学生的历史消息

### 个人中心
- 查看和编辑个人信息
- 点击"编辑资料"修改信息，点击"保存"提交更新

## 回答要求
1. 用友好、专业的语气回答用户问题
2. 回答要简洁明了，使用Markdown格式分点说明
3. 结合之前的对话上下文，提供连贯的回答
4. 如果问题与平台无关，礼貌地引导用户提问平台相关问题
5. 如果不确定答案，建议用户联系平台管理员"""

        try:
            # Build messages with history context
            messages = [{"role": "system", "content": system_prompt}]

            # Add chat history for context (if available)
            if chat_history:
                for msg in chat_history[-6:]:  # Last 6 messages for context
                    messages.append(msg)

            # Add current message
            messages.append({"role": "user", "content": message})

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
                        "max_tokens": 1000
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"AI Service Error: {e}")
            return self._get_customer_service_fallback(message)

    async def get_chat_response_with_rag(
        self,
        message: str,
        context: Optional[str] = None,
        job_id: Optional[int] = None,
        conversation_id: Optional[int] = None
    ) -> str:
        """使用 RAG 增强 + 短时记忆的聊天回复

        Args:
            message: 用户消息
            context: 岗位信息上下文
            job_id: 岗位ID（用于RAG检索）
            conversation_id: 会话ID（用于短时记忆）
        """
        # 获取短时记忆（最近对话）和长期记忆（RAG）
        short_term_context = []
        rag_context = ""

        if conversation_id:
            short_term_context, rag_context = await memory_service.get_combined_context(
                conversation_id=conversation_id,
                current_query=message,
                job_id=job_id
            )
        else:
            # 仅获取 RAG 上下文
            rag_context = await rag_service.build_rag_context(message, job_id)

        # 构建增强的 system prompt
        system_prompt = (
            "你是一个企业HR助手，负责在HR离线时自动回复求职者的问题。"
            "请根据提供的岗位信息、对话历史和历史问答参考，礼貌且专业地回答求职者的问题。"
            "如果问题超出你的知识范围，请建议求职者等待HR上线后再详细咨询。"
        )

        if context:
            system_prompt += f"\n\n岗位信息：{context}"

        if rag_context:
            system_prompt += f"\n\n{rag_context}\n\n请参考以上历史问答，为当前问题提供一致且准确的回答。"

        try:
            # 构建消息列表
            messages = [{"role": "system", "content": system_prompt}]

            # 添加短时记忆（最近对话历史）
            if short_term_context:
                for msg in short_term_context[-6:]:  # 最近6条消息
                    messages.append(msg)

            # 添加当前用户消息
            messages.append({"role": "user", "content": message})

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
                        "max_tokens": 500
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]

                # 保存到短时记忆
                if conversation_id:
                    await memory_service.add_user_message(conversation_id, message)
                    await memory_service.add_assistant_message(conversation_id, ai_response, is_ai=True)

                return ai_response
        except Exception as e:
            print(f"AI Service Error (RAG): {e}")
            return self._get_fallback_response(message)

    def _get_fallback_response(self, message: str) -> str:
        return (
            "感谢您的咨询！HR当前不在线，您的消息已收到。"
            "HR上线后会尽快回复您。如有紧急问题，您可以通过平台客服获取帮助。"
        )

    async def get_customer_service_response_with_rag(
        self,
        message: str,
        user_id: int,
        category: Optional[str] = None
    ) -> str:
        """使用 RAG 增强 + 短时记忆的智能客服回复

        Args:
            message: 用户消息
            user_id: 用户ID（用于获取上下文）
            category: 问题分类（可选）
        """
        # 获取短时记忆和长期记忆（RAG）
        short_term_context, rag_context = await customer_service_memory.get_combined_context(
            user_id=user_id,
            current_query=message,
            category=category
        )

        system_prompt = """你是产学研智能交互平台的智能客服助手，名叫"小智"。

## 平台简介
产学研智能交互平台是一个连接高校学生、科研人员和企业的综合性服务平台。平台旨在促进产学研深度融合，帮助学生找到实习和就业机会，帮助企业对接优质人才和科研资源。

## 平台主要功能
1. **岗位招聘**：企业可以发布岗位信息，学生可以浏览岗位并与HR直接沟通
2. **实时聊天**：学生和HR可以在线实时交流，HR离线时智能助手会自动回复
3. **资源中心**：企业可以发布产学研合作资源（项目合作、实习机会、科研项目、产学研合作）
4. **智能客服**：7x24小时在线解答用户问题
5. **个人中心**：管理个人信息和历史记录

## 用户类型
- **学生用户**：可以浏览岗位、查看资源、与企业HR沟通。学生界面中"资源发布"显示为"资源匹配"
- **企业用户**：可以发布岗位、发布资源、管理招聘流程。企业界面中显示为"资源发布"

## 使用指南

### 注册登录
- 注册：点击首页右上角"注册"按钮，选择用户类型（学生/企业），填写信息即可
- 登录：使用注册的邮箱和密码登录
- 密码找回：如忘记密码，请联系平台管理员

### 岗位功能
- **学生浏览岗位**：进入"岗位招聘"页面查看所有岗位，支持按关键词、地区搜索
- **学生联系HR**：在岗位列表点击"立即沟通"按钮，即可与该岗位的HR聊天
- **企业发布岗位**：登录后进入"岗位招聘"页面，点击"发布岗位"按钮
- **企业管理岗位**：可以编辑、删除已发布的岗位

### 资源功能
- **学生资源匹配**：进入"资源匹配"页面浏览产学研资源，点击"立即沟通"与企业联系
- **企业资源发布**：进入"资源发布"页面，点击"发布资源"按钮，选择资源类型并填写详情
- **资源类型**：项目合作、实习机会、科研项目、产学研合作

### 聊天功能
- 点击岗位或资源的"立即沟通"进入聊天界面
- 绿色圆点表示对方在线，灰色表示离线
- 对方离线时，智能助手会自动回复
- HR上线后可以查看学生的历史消息

### 个人中心
- 查看和编辑个人信息
- 点击"编辑资料"修改信息，点击"保存"提交更新

## 回答要求
1. 用友好、专业的语气回答用户问题
2. 回答要简洁明了，使用Markdown格式分点说明
3. 结合之前的对话上下文，提供连贯的回答
4. 如果问题与平台无关，礼貌地引导用户提问平台相关问题
5. 如果不确定答案，建议用户联系平台管理员"""

        # 添加 RAG 上下文
        if rag_context:
            system_prompt += f"\n\n{rag_context}\n\n请参考以上历史问答，为当前问题提供一致且准确的回答。"

        try:
            # 构建消息列表
            messages = [{"role": "system", "content": system_prompt}]

            # 添加短时记忆（最近对话历史）
            if short_term_context:
                for msg in short_term_context[-10:]:  # 最近10条消息
                    messages.append(msg)

            # 添加当前用户消息
            messages.append({"role": "user", "content": message})

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
                        "max_tokens": 1000
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]

                # 保存到短时记忆
                await customer_service_memory.add_user_message(user_id, message)
                await customer_service_memory.add_assistant_message(user_id, ai_response)

                return ai_response
        except Exception as e:
            print(f"AI Service Error (Customer Service RAG): {e}")
            return self._get_customer_service_fallback(message)

    def _get_customer_service_fallback(self, message: str) -> str:
        keywords_responses = {
            "注册": (
                "注册账号非常简单：\n\n"
                "1. 点击页面右上角的【注册】按钮\n"
                "2. 选择您的用户类型（学生或企业）\n"
                "3. 填写基本信息（姓名、邮箱、手机号等）\n"
                "4. 学生需填写学校和专业，企业需填写公司和职位\n"
                "5. 设置密码并确认\n"
                "6. 点击【注册】完成\n\n"
                "注册成功后即可登录使用平台功能。"
            ),
            "登录": (
                "登录步骤：\n\n"
                "1. 点击页面右上角的【登录】按钮\n"
                "2. 输入您注册时使用的邮箱\n"
                "3. 输入密码\n"
                "4. 点击【登录】即可\n\n"
                "如忘记密码，请联系平台管理员重置。"
            ),
            "岗位": (
                "关于岗位功能：\n\n"
                "【学生用户】\n"
                "- 在首页点击\"岗位招聘\"进入岗位列表\n"
                "- 可按地区、关键词搜索筛选\n"
                "- 点击\"立即沟通\"与HR交流\n\n"
                "【企业用户】\n"
                "1. 登录后进入\"岗位管理\"\n"
                "2. 点击\"发布岗位\"按钮\n"
                "3. 填写岗位名称、薪资、地点、描述等\n"
                "4. 点击\"发布\"完成"
            ),
            "沟通": (
                "与HR在线沟通：\n\n"
                "1. 浏览岗位列表，找到感兴趣的岗位\n"
                "2. 点击【立即沟通】按钮\n"
                "3. 进入聊天界面即可发送消息\n\n"
                "特别说明：\n"
                "- 绿色圆点表示HR在线，可实时回复\n"
                "- 灰色圆点表示HR离线，智能助手会自动回复\n"
                "- HR上线后会收到您的消息通知"
            ),
            "资源": (
                "资源中心功能：\n\n"
                "【浏览资源】\n"
                "- 进入\"资源中心\"查看所有产学研资源\n"
                "- 支持按类型筛选：项目合作、实习机会、科研项目、产学研合作\n\n"
                "【发布资源】（企业用户）\n"
                "1. 登录企业账号\n"
                "2. 进入资源中心\n"
                "3. 点击\"发布资源\"\n"
                "4. 选择资源类型，填写详细信息\n"
                "5. 点击\"发布\"完成"
            ),
            "功能": (
                "平台主要功能：\n\n"
                "1. 【岗位招聘】企业发布岗位，学生浏览应聘\n"
                "2. 【实时沟通】学生与HR在线交流\n"
                "3. 【智能回复】HR离线时AI自动回复\n"
                "4. 【资源中心】产学研资源发布与匹配\n"
                "5. 【智能客服】7x24小时解答平台问题\n"
                "6. 【个人中心】管理个人信息"
            ),
            "平台": (
                "产学研智能交互平台简介：\n\n"
                "本平台是连接高校与企业的综合性服务平台，致力于：\n"
                "- 帮助学生找到优质实习和就业机会\n"
                "- 帮助企业对接高校人才和科研资源\n"
                "- 促进产学研深度融合与合作\n\n"
                "平台特色：\n"
                "- 实时在线沟通\n"
                "- AI智能辅助回复\n"
                "- 7x24小时智能客服"
            )
        }

        for keyword, response in keywords_responses.items():
            if keyword in message:
                return response

        return (
            "您好！我是智能客服小智。\n\n"
            "我可以帮您解答以下问题：\n"
            "- 如何注册/登录\n"
            "- 如何浏览和发布岗位\n"
            "- 如何与HR沟通\n"
            "- 如何使用资源中心\n"
            "- 平台功能介绍\n\n"
            "请问您想了解哪方面的内容？"
        )


ai_service = AIService()
