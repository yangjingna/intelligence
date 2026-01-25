# 基于大模型的产学研智能交互系统 - 产品需求文档（PRD）

## 1. 文档信息

| 项目 | 内容 |
|------|------|
| 产品名称 | 基于大模型的产学研智能交互系统 |
| 版本 | V1.0 |
| 创建日期 | 2026-01-25 |
| 文档状态 | 初稿 |

---

## 2. 产品概述

### 2.1 产品背景

随着产学研合作的深入发展，高校学生与企业之间的沟通需求日益增长。传统的招聘平台存在以下痛点：
- 企业HR无法24小时在线，学生咨询得不到及时响应
- 重复性问题需要HR反复回答，效率低下
- 聊天记录分散，难以追溯和总结
- 缺乏智能化的信息匹配和推荐

### 2.2 产品定位

本系统是一个**智能化的产学研交互平台**，通过引入大语言模型（GLM-4）技术，实现：
- 企业HR离线时AI智能代答
- 聊天记录智能总结与知识库构建
- 7×24小时智能客服服务
- 学生与企业的高效对接

### 2.3 目标用户

| 用户角色 | 描述 | 核心需求 |
|----------|------|----------|
| 学生用户 | 高校在校生、应届毕业生 | 浏览岗位、与HR沟通、获取资源信息 |
| 企业用户 | 企业HR、招聘负责人 | 发布岗位、发布资源、与学生沟通 |

---

## 3. 系统架构

### 3.1 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端层                                │
│              React 19 + Vite + Tailwind CSS                 │
├─────────────────────────────────────────────────────────────┤
│                        接口层                                │
│                    FastAPI (Python)                         │
├─────────────────────────────────────────────────────────────┤
│                        服务层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  用户服务   │  │  聊天服务   │  │   AI服务    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                        数据层                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    MySQL    │  │    Redis    │  │  GLM-4 API  │         │
│  │  (长期记忆) │  │  (短期记忆) │  │  (智能回复) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 数据存储设计

#### 3.2.1 MySQL（长期记忆）
- 用户基本信息
- 岗位信息
- 资源信息
- 会话记录
- 历史消息（持久化）
- 知识库条目

#### 3.2.2 Redis（短期记忆）
- 用户在线状态
- 会话上下文缓存
- 最近聊天记录（用于AI上下文）
- Token缓存
- 实时消息队列

---

## 4. 功能模块详细设计

### 4.1 用户模块

#### 4.1.1 用户注册

| 字段 | 学生用户 | 企业用户 | 必填 |
|------|----------|----------|------|
| 姓名 | ✓ | ✓ | 是 |
| 邮箱 | ✓ | ✓ | 是 |
| 手机号 | ✓ | ✓ | 是 |
| 密码 | ✓ | ✓ | 是（明文存储） |
| 学校 | ✓ | - | 是（学生） |
| 专业 | ✓ | - | 是（学生） |
| 公司名称 | - | ✓ | 是（企业） |
| 职位 | - | ✓ | 是（企业） |

**特别说明**：密码采用明文存储，不进行加密处理。

#### 4.1.2 用户登录
- 支持邮箱 + 密码登录
- 登录成功返回JWT Token
- Token有效期：24小时

#### 4.1.3 个人中心
- 显示用户基本信息
- 支持编辑个人信息
- 点击保存直接更新数据库并刷新页面显示

---

### 4.2 岗位招聘模块

#### 4.2.1 岗位列表（学生视角）

**功能描述**：
- 展示所有企业发布的岗位信息
- 支持按关键词搜索岗位名称/公司名称
- 支持按地区筛选
- 支持按公司名称模糊查询该公司所有岗位

**岗位卡片信息**：
- 岗位名称
- 公司名称
- 薪资范围
- 工作地点
- 经验要求
- 岗位描述
- 技能标签
- HR姓名
- HR在线状态（绿点/灰点）
- 发布时间
- 【立即沟通】按钮

#### 4.2.2 岗位管理（企业视角）

**功能描述**：
- 查看本企业发布的所有岗位
- 发布新岗位
- 编辑已有岗位
- 删除岗位

**重要规则**：
- 每个岗位绑定一个HR账号
- 不同岗位可以对应不同的HR
- 学生点击岗位只能与该岗位对应的HR沟通

---

### 4.3 实时聊天模块（核心智能化功能）

#### 4.3.1 聊天入口
- 学生在岗位列表点击【立即沟通】进入聊天
- 学生在资源匹配点击【立即沟通】进入聊天
- 基于岗位/资源创建会话，一个岗位对应一个独立会话

#### 4.3.2 在线状态监测

**实现方式**：WebSocket实时连接

| 状态 | 显示 | 说明 |
|------|------|------|
| 在线 | 🟢 绿色圆点 + "在线" | HR已登录且WebSocket连接正常 |
| 离线 | ⚪ 灰色圆点 + "离线 - 智能体将自动回复" | HR未登录或断开连接 |

#### 4.3.3 消息类型

| 类型 | 发送方 | 显示样式 | 说明 |
|------|--------|----------|------|
| 普通消息 | 学生 | 蓝色气泡（右侧） | 学生发送的消息 |
| 普通消息 | HR | 白色气泡（左侧） | HR回复的消息 |
| AI回复 | 系统 | 紫色气泡（左侧）+ 🤖 智能体回答 | HR离线时AI代答 |

#### 4.3.4 智能化功能

##### A. HR离线时AI智能代答

**触发条件**：
1. HR处于离线状态
2. 学生发送消息

**AI回复流程**：
```
学生发送消息
    ↓
检测HR是否在线
    ↓
HR离线 → 调用知识库 + GLM-4生成回复
    ↓
消息标记为"智能体回答"并发送
    ↓
存储到MySQL（长期记忆）
```

**AI上下文来源**：
1. 岗位信息（职位、公司、薪资、描述）
2. 最近10条聊天记录（从Redis获取）
3. 知识库匹配内容（从MySQL获取）

##### B. 聊天记录智能总结

**功能描述**：
- 自动提取聊天中的关键信息
- 生成会话摘要存入知识库
- 当相似问题再次出现时，AI可直接调用历史回答

**总结内容**：
- 学生关心的核心问题
- HR/AI给出的关键回答
- 岗位相关的补充信息

##### C. 知识库构建

**知识库来源**：
1. 岗位详情信息
2. 历史聊天记录总结
3. 常见问题FAQ
4. 企业自定义知识

**存储结构**（MySQL）：
```sql
CREATE TABLE knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enterprise_id INT,          -- 企业ID
    job_id INT,                 -- 关联岗位（可选）
    question TEXT,              -- 问题/关键词
    answer TEXT,                -- 答案内容
    source VARCHAR(50),         -- 来源：chat_summary/faq/custom
    created_at DATETIME,
    updated_at DATETIME
);
```

##### D. Redis短期记忆设计

**缓存内容**：
```
# 用户在线状态
online:user:{user_id} = "1" (TTL: 30s, 需要心跳刷新)

# 会话上下文（最近10条消息）
chat:context:{conversation_id} = [消息列表] (TTL: 1小时)

# AI回复缓存（避免重复调用API）
ai:cache:{question_hash} = "回复内容" (TTL: 24小时)
```

---

### 4.4 资源发布/匹配模块

#### 4.4.1 界面差异

| 用户角色 | 模块名称 | 功能权限 |
|----------|----------|----------|
| 企业用户 | 资源发布 | 发布、编辑、删除、查看资源 |
| 学生用户 | 资源匹配 | 浏览、搜索、沟通资源 |

#### 4.4.2 资源类型

- 项目合作
- 实习机会
- 科研项目
- 产学研合作

#### 4.4.3 资源信息

| 字段 | 说明 |
|------|------|
| 资源标题 | 资源名称 |
| 资源类型 | 四种类型之一 |
| 公司名称 | 发布企业 |
| 详细描述 | 资源详情 |
| 技能标签 | 相关技术标签 |
| 联系人 | 负责人姓名 |
| 截止日期 | 资源有效期 |

#### 4.4.4 搜索功能
- 支持关键词搜索
- 支持按类型筛选
- **支持按公司名称模糊查询**

#### 4.4.5 沟通功能
- 点击【立即沟通】进入聊天界面
- 聊天功能与岗位沟通完全一致
- 支持在线状态检测
- 支持AI智能代答

---

### 4.5 智能客服模块

#### 4.5.1 功能定位
- 7×24小时在线解答平台使用问题
- 不涉及具体岗位/资源的咨询
- 引导用户正确使用平台功能

#### 4.5.2 技术实现
- 调用智谱GLM-4模型
- 预设平台相关的系统提示词
- **支持Markdown格式渲染**

#### 4.5.3 可回答的问题类型
- 如何注册/登录
- 如何浏览和发布岗位
- 如何与HR沟通
- 如何使用资源中心
- 平台功能介绍
- 其他平台相关问题

#### 4.5.4 Markdown渲染
- 支持标题（#）
- 支持列表（-、1.）
- 支持加粗（**）
- 支持代码块（```）
- 支持链接

---

### 4.6 个人中心模块

#### 4.6.1 信息展示

**学生用户**：
- 头像
- 姓名
- 邮箱
- 手机号
- 学校
- 专业

**企业用户**：
- 头像
- 姓名
- 邮箱
- 手机号
- 公司名称
- 职位

#### 4.6.2 编辑功能
- 点击编辑按钮进入编辑模式
- 修改信息后点击保存
- **保存后立即更新数据库**
- **页面同步刷新显示最新信息**

---

## 5. 接口设计

### 5.1 认证接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/auth/register | POST | 用户注册 |
| /api/auth/login | POST | 用户登录 |
| /api/auth/profile | GET | 获取个人信息 |
| /api/auth/profile | PUT | 更新个人信息 |

### 5.2 岗位接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/jobs | GET | 获取岗位列表（支持搜索、筛选） |
| /api/jobs/{id} | GET | 获取岗位详情 |
| /api/jobs | POST | 发布岗位（企业） |
| /api/jobs/{id} | PUT | 编辑岗位（企业） |
| /api/jobs/{id} | DELETE | 删除岗位（企业） |
| /api/jobs/my | GET | 获取我的岗位（企业） |
| /api/jobs/company | GET | 按公司名模糊查询岗位 |

### 5.3 资源接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/resources | GET | 获取资源列表 |
| /api/resources/{id} | GET | 获取资源详情 |
| /api/resources | POST | 发布资源（企业） |
| /api/resources/{id} | PUT | 编辑资源（企业） |
| /api/resources/{id} | DELETE | 删除资源（企业） |
| /api/resources/my | GET | 获取我的资源（企业） |

### 5.4 聊天接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/chat/conversations | GET | 获取会话列表 |
| /api/chat/conversations/get-or-create | POST | 获取或创建会话 |
| /api/chat/conversations/{id}/messages | GET | 获取消息列表 |
| /api/chat/conversations/{id}/messages | POST | 发送消息 |
| /api/chat/conversations/{id}/summary | GET | 获取会话智能总结 |

### 5.5 智能客服接口

| 接口 | 方法 | 说明 |
|------|------|------|
| /api/customer-service/chat | POST | 发送消息给智能客服 |
| /api/customer-service/history | GET | 获取客服聊天历史 |

### 5.6 WebSocket接口

| 接口 | 说明 |
|------|------|
| /ws?token={jwt_token} | 建立WebSocket连接 |

**消息类型**：
- `new_message`: 新消息通知
- `online_status`: 用户上下线通知
- `typing`: 正在输入提示

---

## 6. 数据库设计

### 6.1 用户表 (users)

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,  -- 明文密码
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('student', 'enterprise') NOT NULL,
    school VARCHAR(100),      -- 学生
    major VARCHAR(100),       -- 学生
    company VARCHAR(100),     -- 企业
    position VARCHAR(100),    -- 企业
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 6.2 岗位表 (jobs)

```sql
CREATE TABLE jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    salary VARCHAR(50),
    location VARCHAR(100),
    experience VARCHAR(50),
    description TEXT,
    tags JSON,
    hr_id INT NOT NULL,       -- 绑定的HR账号ID
    hr_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hr_id) REFERENCES users(id)
);
```

### 6.3 资源表 (resources)

```sql
CREATE TABLE resources (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    type ENUM('project', 'internship', 'research', 'cooperation') NOT NULL,
    company VARCHAR(200) NOT NULL,
    description TEXT,
    tags JSON,
    contact_id INT NOT NULL,
    contact_name VARCHAR(100),
    deadline DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES users(id)
);
```

### 6.4 会话表 (conversations)

```sql
CREATE TABLE conversations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user1_id INT NOT NULL,    -- 学生ID
    user2_id INT NOT NULL,    -- 企业HR ID
    job_id INT,               -- 关联岗位
    resource_id INT,          -- 关联资源
    last_message TEXT,
    last_message_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (resource_id) REFERENCES resources(id)
);
```

### 6.5 消息表 (messages)

```sql
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    type ENUM('text', 'ai_response') DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### 6.6 知识库表 (knowledge_base)

```sql
CREATE TABLE knowledge_base (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enterprise_id INT,
    job_id INT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    source ENUM('chat_summary', 'faq', 'custom') DEFAULT 'chat_summary',
    embedding BLOB,           -- 向量嵌入（用于语义搜索）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enterprise_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
);
```

### 6.7 智能客服消息表 (customer_service_messages)

```sql
CREATE TABLE customer_service_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 7. 智能化特性总结

### 7.1 核心智能化功能

| 功能 | 描述 | 技术实现 |
|------|------|----------|
| AI智能代答 | HR离线时自动回复学生问题 | GLM-4 + 知识库检索 |
| 聊天记录总结 | 自动提取关键信息存入知识库 | GLM-4文本总结 |
| 知识库问答 | 基于历史记录回答相似问题 | 向量检索 + GLM-4 |
| 智能客服 | 7×24小时解答平台问题 | GLM-4 + 预设知识 |
| 在线状态监测 | 实时检测用户在线状态 | WebSocket + Redis |

### 7.2 智能体标识

所有AI生成的回复都会在消息中明确标注：
- 显示🤖图标
- 显示"智能体回答"文字
- 使用紫色气泡与普通消息区分

---

## 8. 非功能性需求

### 8.1 性能要求
- 页面加载时间 ≤ 2秒
- API响应时间 ≤ 500ms（不含AI调用）
- AI回复时间 ≤ 5秒
- WebSocket消息延迟 ≤ 100ms

### 8.2 安全要求
- JWT Token认证
- HTTPS传输（生产环境）
- SQL注入防护
- XSS防护

### 8.3 可用性要求
- 系统可用性 ≥ 99%
- 支持主流浏览器（Chrome、Firefox、Edge、Safari）

---

## 9. 版本规划

### V1.0（当前版本）
- [x] 用户注册登录
- [x] 岗位发布与浏览
- [x] 实时聊天
- [x] 在线状态检测
- [x] AI智能代答
- [x] 资源发布与匹配
- [x] 智能客服
- [x] 个人中心

### V1.1（计划中）
- [ ] 聊天记录智能总结
- [ ] 知识库管理
- [ ] 简历上传与解析
- [ ] 岗位推荐算法

### V2.0（规划中）
- [ ] 视频面试功能
- [ ] 企业认证机制
- [ ] 数据分析报表
- [ ] 移动端适配

---

## 10. 附录

### 10.1 GLM-4 API调用示例

```python
import httpx

async def call_glm4(prompt: str, context: str = ""):
    response = await httpx.AsyncClient().post(
        "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "glm-4",
            "messages": [
                {"role": "system", "content": context},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }
    )
    return response.json()["choices"][0]["message"]["content"]
```

### 10.2 Redis缓存策略

```python
# 在线状态
await redis.setex(f"online:user:{user_id}", 30, "1")

# 会话上下文
await redis.lpush(f"chat:context:{conv_id}", message)
await redis.ltrim(f"chat:context:{conv_id}", 0, 9)  # 保留最近10条
await redis.expire(f"chat:context:{conv_id}", 3600)  # 1小时过期
```

---

**文档结束**
