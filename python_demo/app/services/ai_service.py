# -*- coding: utf-8 -*-
import httpx
import json
from typing import Optional, List, Dict, Any
from ..core.config import settings
from .sql_rag_service import sql_rag_service
from .memory_service import memory_service
from .customer_service_memory import customer_service_memory
from .job_search_service import job_search_service


class AIService:
    def __init__(self):
        self.api_key = settings.GLM_API_KEY
        self.api_url = settings.GLM_API_URL

        # 定义可用的工具
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_jobs",
                    "description": "搜索平台上的岗位信息。当用户询问岗位推荐、找工作、查看职位时调用此工具。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "keywords": {
                                "type": "string",
                                "description": "搜索关键词，如岗位名称、技能、职位类型等。例如：'前端开发'、'Python'、'算法'"
                            },
                            "location": {
                                "type": "string",
                                "description": "工作地点，如：'北京'、'上海'、'深圳'"
                            },
                            "experience": {
                                "type": "string",
                                "description": "工作经验要求，如：'应届生'、'1-3年'、'3-5年'"
                            }
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_company_jobs",
                    "description": "搜索指定公司的岗位信息。当用户提到具体公司名称并想了解该公司岗位时调用。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "company_name": {
                                "type": "string",
                                "description": "公司名称，如：'字节跳动'、'阿里巴巴'、'腾讯'"
                            }
                        },
                        "required": ["company_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_job_recommendations",
                    "description": "根据用户的技能和偏好推荐合适的岗位。当用户说'为我推荐'、'帮我找'、'我擅长XX'时调用。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "skills": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "用户的技能列表，如：['Python', 'AI', '机器学习']"
                            },
                            "job_type": {
                                "type": "string",
                                "description": "意向岗位类型，如：'算法工程师'、'后端开发'"
                            },
                            "location": {
                                "type": "string",
                                "description": "意向工作地点"
                            }
                        },
                        "required": []
                    }
                }
            }
        ]

    def _execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> str:
        """执行工具调用并返回结果"""
        print(f"[AI] 执行工具: {tool_name}, 参数: {arguments}")

        try:
            if tool_name == "search_jobs":
                jobs = job_search_service.search_jobs(
                    keywords=arguments.get("keywords"),
                    location=arguments.get("location"),
                    experience=arguments.get("experience"),
                    limit=5
                )
                if jobs:
                    return self._format_job_results(jobs, "搜索结果")
                else:
                    return "抱歉，没有找到符合条件的岗位。您可以尝试放宽搜索条件，或者告诉我更多您的需求。"

            elif tool_name == "search_company_jobs":
                result = job_search_service.search_by_company(
                    company_name=arguments.get("company_name", ""),
                    limit=5
                )
                if result["found"]:
                    return self._format_company_jobs(result)
                else:
                    return result["message"]

            elif tool_name == "get_job_recommendations":
                skills = arguments.get("skills", [])
                # 如果skills是字符串，转换为列表
                if isinstance(skills, str):
                    skills = [s.strip() for s in skills.split(",")]

                jobs = job_search_service.get_job_recommendations(
                    job_type=arguments.get("job_type"),
                    location=arguments.get("location"),
                    skills=skills,
                    limit=5
                )
                if jobs:
                    return self._format_job_results(jobs, "为您推荐以下岗位")
                else:
                    return "抱歉，暂时没有找到完全匹配的岗位。建议您放宽条件或者直接浏览平台上的岗位列表。"

            else:
                return f"未知的工具: {tool_name}"

        except Exception as e:
            print(f"[AI] 工具执行错误: {e}")
            return f"查询岗位信息时出现错误，请稍后重试。"

    def _format_job_results(self, jobs: List[Dict], title: str) -> str:
        """格式化岗位搜索结果"""
        if not jobs:
            return "没有找到相关岗位"

        result = f"{title}（共{len(jobs)}个）：\n\n"
        for i, job in enumerate(jobs, 1):
            result += f"**{i}. {job['title']}**\n"
            result += f"   - 公司：{job.get('company', '未知')}\n"
            result += f"   - 薪资：{job.get('salary', '面议')}\n"
            result += f"   - 地点：{job.get('location', '不限')}\n"
            result += f"   - 经验：{job.get('experience', '不限')}\n"
            if job.get('tags'):
                result += f"   - 标签：{', '.join(job['tags'][:5])}\n"
            if job.get('match_reason'):
                result += f"   - 匹配原因：{job['match_reason']}\n"
            result += "\n"

        result += "\n💡 您可以在【岗位招聘】页面查看详情并与HR沟通。"
        return result

    def _format_company_jobs(self, result: Dict) -> str:
        """格式化公司岗位结果"""
        output = f"**{result['company_name']}** 目前有 {result['job_count']} 个在招岗位：\n\n"

        for i, job in enumerate(result['jobs'], 1):
            output += f"**{i}. {job['title']}**\n"
            output += f"   - 薪资：{job.get('salary', '面议')}\n"
            output += f"   - 地点：{job.get('location', '不限')}\n"
            output += f"   - 经验：{job.get('experience', '不限')}\n"
            if job.get('tags'):
                output += f"   - 标签：{', '.join(job['tags'][:5])}\n"
            output += "\n"

        output += "\n💡 您可以在【岗位招聘】页面搜索该公司查看更多详情。"
        return output

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

    async def get_customer_service_response_with_context(
        self,
        message: str,
        short_term_context: List[dict],
        rag_context: str = "",
        slot_context: str = "",
        user_slots: Dict[str, Any] = None
    ) -> str:
        """使用预获取的上下文生成智能客服回复（支持工具调用）

        Args:
            message: 用户消息
            short_term_context: 短期记忆上下文（已获取）
            rag_context: RAG长期记忆上下文（已获取）
            slot_context: 槽位上下文（用户画像信息）
            user_slots: 用户槽位数据（用于工具调用）
        """
        system_prompt = self._get_customer_service_system_prompt_with_tools(slot_context)

        # 添加 RAG 上下文
        if rag_context:
            system_prompt += f"\n\n## 相关知识库\n{rag_context}\n\n请参考以上历史问答，为当前问题提供一致且准确的回答。"

        try:
            # 构建消息列表
            messages = [{"role": "system", "content": system_prompt}]

            # 添加短时记忆（最近对话历史）
            if short_term_context:
                print(f"[AI] 添加 {len(short_term_context[-10:])} 条历史消息到上下文")
                for msg in short_term_context[-10:]:  # 最近10条消息
                    messages.append(msg)

            # 添加当前用户消息
            messages.append({"role": "user", "content": message})

            print(f"[AI] 发送请求到GLM API（带工具），消息数: {len(messages)}")
            if slot_context:
                print(f"[AI] 槽位上下文: {slot_context[:100]}...")

            async with httpx.AsyncClient() as client:
                # 第一次调用：可能触发工具调用
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "glm-4",
                        "messages": messages,
                        "tools": self.tools,
                        "tool_choice": "auto",
                        "temperature": 0.7,
                        "max_tokens": 1000
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()

                assistant_message = data["choices"][0]["message"]
                print(f"[AI] 第一次响应: finish_reason={data['choices'][0].get('finish_reason')}")

                # 检查是否有工具调用
                if assistant_message.get("tool_calls"):
                    print(f"[AI] 检测到工具调用: {len(assistant_message['tool_calls'])} 个")

                    # 将助手消息添加到消息列表
                    messages.append(assistant_message)

                    # 执行所有工具调用
                    for tool_call in assistant_message["tool_calls"]:
                        function_name = tool_call["function"]["name"]
                        function_args = json.loads(tool_call["function"]["arguments"])

                        # 如果有用户槽位信息，补充到工具参数中
                        if user_slots and function_name == "get_job_recommendations":
                            if not function_args.get("job_type") and user_slots.get("job_type"):
                                function_args["job_type"] = user_slots["job_type"]
                            if not function_args.get("location") and user_slots.get("location"):
                                function_args["location"] = user_slots["location"]

                        # 执行工具
                        tool_result = self._execute_tool(function_name, function_args)

                        # 添加工具结果到消息列表
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "content": tool_result
                        })

                    # 第二次调用：根据工具结果生成最终回复
                    print(f"[AI] 发送第二次请求（含工具结果）")
                    response2 = await client.post(
                        self.api_url,
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "glm-4",
                            "messages": messages,
                            "temperature": 0.7,
                            "max_tokens": 1500
                        },
                        timeout=30.0
                    )
                    response2.raise_for_status()
                    data2 = response2.json()
                    ai_reply = data2["choices"][0]["message"]["content"]
                    print(f"[AI] 最终回复长度: {len(ai_reply)}")
                    return ai_reply
                else:
                    # 没有工具调用，直接返回回复
                    ai_reply = assistant_message.get("content", "")
                    print(f"[AI] GLM API调用成功，回复长度: {len(ai_reply)}")
                    return ai_reply

        except Exception as e:
            print(f"[AI] GLM API调用失败: {e}")
            import traceback
            traceback.print_exc()
            print(f"[AI] 使用Fallback响应")
            return self._get_customer_service_fallback(message)

    def _get_customer_service_system_prompt(self, slot_context: str = "") -> str:
        """获取智能客服系统提示词（无工具版本）

        Args:
            slot_context: 槽位上下文信息
        """
        base_prompt = """你是产学研智能交互平台的智能客服助手，名叫"小智"。你的职责是帮助用户了解和使用平台功能。

## 平台简介
产学研智能交互平台是一个连接高校学生、科研人员和企业的综合性服务平台。平台旨在促进产学研深度融合，帮助学生找到实习和就业机会，帮助企业对接优质人才和科研资源。

## 平台主要功能
1. **岗位招聘**：企业可以发布岗位信息，学生可以浏览岗位并与HR直接沟通
2. **实时聊天**：学生和HR可以在线实时交流，HR离线时智能助手会自动回复
3. **资源中心**：企业可以发布产学研合作资源（项目合作、实习机会、科研项目、产学研合作）
4. **智能客服**：7x24小时在线解答用户问题
5. **个人中心**：管理个人信息和历史记录

## 回答要求
1. 用友好、专业、热情的语气回答用户问题
2. 回答要简洁明了，使用Markdown格式分点说明
3. 结合槽位信息和对话历史，记住用户提供的所有信息
4. 始终保持积极主动的服务态度"""

        if slot_context:
            base_prompt += f"\n\n## 当前对话状态\n{slot_context}"

        return base_prompt

    def _get_customer_service_system_prompt_with_tools(self, slot_context: str = "") -> str:
        """获取智能客服系统提示词（带工具调用版本）

        Args:
            slot_context: 槽位上下文信息
        """
        base_prompt = """你是产学研智能交互平台的智能客服助手，名叫"小智"。你具备以下能力：

## 你的核心能力
1. **岗位搜索**：可以根据用户需求搜索平台上的真实岗位
2. **公司查询**：可以查询特定公司在平台上发布的岗位
3. **智能推荐**：可以根据用户的技能和偏好推荐合适的岗位
4. **平台咨询**：解答关于平台使用的各种问题

## 工具使用指南
你有以下工具可以使用：

1. **search_jobs**: 搜索岗位
   - 当用户询问"有什么岗位"、"找XX工作"时使用
   - 参数：keywords(关键词)、location(地点)、experience(经验)

2. **search_company_jobs**: 搜索公司岗位
   - 当用户提到具体公司名称如"字节跳动"、"阿里"、"腾讯"时使用
   - 参数：company_name(公司名称)

3. **get_job_recommendations**: 智能推荐岗位
   - 当用户说"为我推荐"、"我擅长XX"、"帮我找适合的"时使用
   - 参数：skills(技能列表)、job_type(岗位类型)、location(地点)

## 重要：工具调用策略
- 当用户表达求职意向或询问岗位时，**必须调用工具**获取真实数据
- 用户说"我精通AI/Python/前端..."时，提取技能并调用get_job_recommendations
- 用户提到公司名称时，调用search_company_jobs查询该公司岗位
- 用户说"推荐岗位"但没给具体信息时，先询问其技能或意向

## 对话示例

**示例1：技能推荐**
用户：我精通AI和机器学习，帮我推荐岗位
助手：[调用get_job_recommendations，skills=["AI", "机器学习"]]
然后根据结果回复具体岗位信息

**示例2：公司查询**
用户：字节跳动
助手：[调用search_company_jobs，company_name="字节跳动"]
然后展示该公司的岗位列表

**示例3：关键词搜索**
用户：有没有Python相关的工作
助手：[调用search_jobs，keywords="Python"]
然后展示搜索结果

## 回复格式
- 调用工具获取数据后，用清晰的格式展示岗位信息
- 每个岗位显示：职位名称、公司、薪资、地点、经验要求
- 最后提醒用户可以在【岗位招聘】页面查看详情

## 平台简介
产学研智能交互平台连接高校学生和企业，提供岗位招聘、实时沟通、资源对接等服务。"""

        # 添加槽位上下文
        if slot_context:
            base_prompt += f"\n\n## 当前用户画像\n{slot_context}\n\n请结合用户画像信息，在调用工具时自动补充相关参数。"

        return base_prompt

    async def get_customer_service_response_with_rag(
        self,
        message: str,
        user_id: int,
        category: Optional[str] = None
    ) -> str:
        """使用 RAG 增强 + 短时记忆的智能客服回复（旧版，保留兼容）

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
            "推荐": (
                "我来帮您找到合适的岗位！\n\n"
                "**查找岗位步骤：**\n"
                "1. 点击顶部导航栏的【岗位招聘】\n"
                "2. 使用搜索框输入关键词（如：前端、Java、产品经理等）\n"
                "3. 可以按地区筛选（北京、上海、深圳等）\n"
                "4. 找到感兴趣的岗位后，点击【立即沟通】与HR交流\n\n"
                "**热门岗位方向：**\n"
                "- 技术类：前端开发、后端开发、算法工程师\n"
                "- 产品类：产品经理、数据分析师\n"
                "- 其他：嵌入式开发、测试工程师\n\n"
                "您可以告诉我您的专业或意向岗位，我帮您提供更具体的建议！"
            ),
            "找工作": (
                "我来帮您找工作！\n\n"
                "**操作步骤：**\n"
                "1. 点击顶部【岗位招聘】进入岗位列表\n"
                "2. 使用搜索和筛选找到心仪岗位\n"
                "3. 点击【立即沟通】与HR在线交流\n\n"
                "平台有丰富的岗位资源，包括实习、校招、社招等。您是想找什么类型的工作呢？"
            ),
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
                "**查找岗位：**\n"
                "1. 点击顶部导航【岗位招聘】\n"
                "2. 浏览岗位列表或使用搜索筛选\n"
                "3. 点击【立即沟通】与HR交流\n\n"
                "**发布岗位（企业用户）：**\n"
                "1. 登录企业账号\n"
                "2. 进入\"岗位招聘\"页面\n"
                "3. 点击\"发布岗位\"按钮\n"
                "4. 填写岗位信息后发布"
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
