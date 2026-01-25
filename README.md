# 产学研智能交互系统

针对于"产学研智能交互系统"为研究对象，在传统 Web 平台的基础上，引入智能客服模块，用于解答常见问题、引导用户操作，提高平台的交互效率和使用体验，为高校与企业搭建一个更加高效、便捷的合作平台。

## 技术栈

### 前端
- React 19 + Vite
- Tailwind CSS
- React Router DOM
- Zustand (状态管理)
- Axios (HTTP 请求)

### 后端
- Python FastAPI
- SQLAlchemy ORM
- MySQL 数据库
- JWT 认证
- WebSocket 实时通信
- GLM-4 大模型集成

## 项目结构

```
intelligence/
├── react_demo/          # 前端项目
│   ├── src/
│   │   ├── components/  # 通用组件
│   │   ├── pages/       # 页面组件
│   │   ├── stores/      # 状态管理
│   │   ├── services/    # API 服务
│   │   ├── hooks/       # 自定义 Hooks
│   │   └── utils/       # 工具函数
│   └── ...
│
├── python_demo/         # 后端项目
│   ├── app/
│   │   ├── api/         # API 路由
│   │   ├── core/        # 核心配置
│   │   ├── models/      # 数据库模型
│   │   ├── schemas/     # Pydantic 模型
│   │   └── services/    # 业务服务
│   └── ...
│
└── README.md
```

## 快速开始

### 前端

```bash
cd react_demo

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 http://localhost:5173 启动

### 后端

```bash
cd python_demo

# 创建虚拟环境
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
# 编辑 .env 文件，配置数据库和 API 密钥

# 创建数据库
# 先在 MySQL 中创建数据库: CREATE DATABASE intelligence_db;

# 初始化数据库表
python init_db.py

# 启动服务器
python run.py
```

后端将在 http://localhost:8000 启动

API 文档: http://localhost:8000/docs

## 功能模块

1. **首页** - 平台简介和功能入口
2. **用户认证** - 登录/注册（学生/企业）
3. **岗位管理** - 企业发布岗位，学生浏览应聘
4. **实时聊天** - 学生与HR在线沟通
5. **在线状态** - HR在线状态检测
6. **智能回复** - HR离线时AI自动回复
7. **资源中心** - 产学研资源发布与匹配
8. **智能客服** - 24小时AI客服支持
9. **个人中心** - 个人信息管理

## 环境变量

后端 `.env` 文件配置:

```env
# 数据库连接
DATABASE_URL=mysql+pymysql://user:password@localhost:3306/intelligence_db

# JWT 配置
SECRET_KEY=your-secret-key
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# GLM API 配置
GLM_API_KEY=your-glm-api-key
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

## 开发说明

### 前端开发

- 使用 Tailwind CSS 进行样式开发
- 使用 Zustand 进行状态管理
- 使用 React Router 进行路由管理

### 后端开发

- 使用 FastAPI 异步框架
- 使用 SQLAlchemy ORM 操作数据库
- 使用 JWT 进行认证
- 使用 WebSocket 实现实时通信
