# -*- coding: utf-8 -*-
"""
初始化客服知识库 - 预设常见问答
运行方式：python -m app.scripts.init_customer_service_knowledge
"""
import asyncio
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.services.customer_service_memory import customer_service_memory


# 预设的常见问答
PRESET_QA_PAIRS = [
    # 注册登录相关
    {
        "question": "如何注册账号？",
        "answer": """注册账号非常简单：

1. 点击页面右上角的【注册】按钮
2. 选择您的用户类型（学生或企业）
3. 填写基本信息（姓名、邮箱、手机号等）
4. 学生需填写学校和专业，企业需填写公司和职位
5. 设置密码并确认
6. 点击【注册】完成

注册成功后即可登录使用平台功能。""",
        "category": "注册登录",
        "keywords": "注册,账号,新用户"
    },
    {
        "question": "如何登录？",
        "answer": """登录步骤：

1. 点击页面右上角的【登录】按钮
2. 输入您注册时使用的邮箱
3. 输入密码
4. 点击【登录】即可

如忘记密码，请联系平台管理员重置。""",
        "category": "注册登录",
        "keywords": "登录,密码,邮箱"
    },
    {
        "question": "忘记密码怎么办？",
        "answer": """如果您忘记了密码，请按以下步骤操作：

1. 联系平台管理员申请密码重置
2. 提供您的注册邮箱和手机号进行身份验证
3. 管理员验证通过后会为您重置密码
4. 收到新密码后请尽快登录并修改密码

建议使用容易记忆但安全的密码组合。""",
        "category": "注册登录",
        "keywords": "忘记密码,重置密码,找回密码"
    },

    # 岗位相关
    {
        "question": "如何浏览岗位？",
        "answer": """浏览岗位步骤：

1. 在首页点击"岗位招聘"进入岗位列表
2. 可按地区、关键词搜索筛选
3. 点击岗位卡片查看详细信息
4. 点击"立即沟通"与HR交流

岗位列表会显示岗位名称、公司、薪资、地点等关键信息。""",
        "category": "岗位招聘",
        "keywords": "浏览岗位,搜索岗位,查看岗位"
    },
    {
        "question": "如何发布岗位？",
        "answer": """企业用户发布岗位步骤：

1. 登录企业账号
2. 进入"岗位招聘"页面
3. 点击"发布岗位"按钮
4. 填写岗位信息：
   - 岗位名称
   - 薪资范围
   - 工作地点
   - 学历要求
   - 岗位描述和要求
5. 点击"发布"完成

发布后学生即可在岗位列表中看到您的岗位。""",
        "category": "岗位招聘",
        "keywords": "发布岗位,招聘,企业发布"
    },
    {
        "question": "如何与HR沟通？",
        "answer": """与HR在线沟通：

1. 浏览岗位列表，找到感兴趣的岗位
2. 点击【立即沟通】按钮
3. 进入聊天界面即可发送消息

特别说明：
- 绿色圆点表示HR在线，可实时回复
- 灰色圆点表示HR离线，智能助手会自动回复
- HR上线后会收到您的消息通知""",
        "category": "岗位招聘",
        "keywords": "沟通,联系HR,聊天,在线沟通"
    },

    # 资源相关
    {
        "question": "如何浏览资源？",
        "answer": """浏览资源步骤：

1. 进入"资源中心"或"资源匹配"页面
2. 查看所有产学研资源
3. 支持按类型筛选：
   - 项目合作
   - 实习机会
   - 科研项目
   - 产学研合作
4. 点击"立即沟通"与发布者联系""",
        "category": "资源中心",
        "keywords": "资源,浏览资源,资源匹配"
    },
    {
        "question": "如何发布资源？",
        "answer": """企业用户发布资源步骤：

1. 登录企业账号
2. 进入"资源发布"页面
3. 点击"发布资源"按钮
4. 选择资源类型：
   - 项目合作
   - 实习机会
   - 科研项目
   - 产学研合作
5. 填写资源详细信息
6. 点击"发布"完成""",
        "category": "资源中心",
        "keywords": "发布资源,资源发布,企业资源"
    },

    # 平台功能
    {
        "question": "平台有哪些功能？",
        "answer": """平台主要功能：

1. **岗位招聘**：企业发布岗位，学生浏览应聘
2. **实时沟通**：学生与HR在线交流
3. **智能回复**：HR离线时AI自动回复
4. **资源中心**：产学研资源发布与匹配
5. **智能客服**：7x24小时解答平台问题
6. **个人中心**：管理个人信息""",
        "category": "平台功能",
        "keywords": "功能,平台功能,功能介绍"
    },
    {
        "question": "平台是做什么的？",
        "answer": """产学研智能交互平台简介：

本平台是连接高校与企业的综合性服务平台，致力于：
- 帮助学生找到优质实习和就业机会
- 帮助企业对接高校人才和科研资源
- 促进产学研深度融合与合作

平台特色：
- 实时在线沟通
- AI智能辅助回复
- 7x24小时智能客服""",
        "category": "平台功能",
        "keywords": "平台,介绍,产学研"
    },

    # 个人中心
    {
        "question": "如何修改个人信息？",
        "answer": """修改个人信息步骤：

1. 登录后点击右上角头像进入"个人中心"
2. 查看当前个人信息
3. 点击"编辑资料"按钮
4. 修改需要更新的信息
5. 点击"保存"提交更新

可修改的信息包括：姓名、手机号、学校/公司、专业/职位等。""",
        "category": "个人中心",
        "keywords": "个人信息,修改资料,编辑资料"
    },
    {
        "question": "学生和企业用户有什么区别？",
        "answer": """学生用户和企业用户的区别：

**学生用户**
- 可以浏览岗位、查看资源
- 可以与企业HR沟通
- 界面显示"资源匹配"

**企业用户**
- 可以发布岗位和资源
- 可以管理招聘流程
- 可以回复学生咨询
- 界面显示"资源发布"

注册时请根据身份选择正确的用户类型。""",
        "category": "平台功能",
        "keywords": "学生,企业,用户类型,区别"
    }
]


async def init_knowledge_base():
    """初始化客服知识库"""
    print("开始初始化客服知识库...")

    success_count = 0
    fail_count = 0

    for qa in PRESET_QA_PAIRS:
        try:
            result = await customer_service_memory.index_qa_pair(
                question=qa["question"],
                answer=qa["answer"],
                category=qa.get("category"),
                keywords=qa.get("keywords"),
                is_preset=True
            )
            if result:
                success_count += 1
                print(f"  ✓ 已添加: {qa['question'][:30]}...")
            else:
                fail_count += 1
                print(f"  ✗ 添加失败: {qa['question'][:30]}...")
        except Exception as e:
            fail_count += 1
            print(f"  ✗ 错误: {qa['question'][:30]}... - {e}")

    print(f"\n初始化完成！成功: {success_count}, 失败: {fail_count}")

    # 显示统计信息
    stats = customer_service_memory.get_knowledge_stats()
    print(f"\n知识库统计:")
    print(f"  - 总记录数: {stats['total_records']}")
    print(f"  - 预设问答: {stats['preset_count']}")
    print(f"  - 学习问答: {stats['learned_count']}")


if __name__ == "__main__":
    asyncio.run(init_knowledge_base())
