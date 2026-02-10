import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import useUserStore from '../../stores/userStore'
import api from '../../services/api'

const FeatureCard = ({ to, title, description }) => (
  <Link
    to={to}
    className="block p-6 bg-white border border-gray-300 hover:border-blue-700 hover:shadow-md transition-shadow"
  >
    <div className="w-10 h-10 bg-blue-700 flex items-center justify-center mb-4">
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </Link>
)

const Home = () => {
  const { isAuthenticated, user, isEnterprise, isGovernment, isUniversity, isStudent } = useUserStore()
  const [stats, setStats] = useState({
    enterprise_count: 0,
    student_count: 0,
    job_count: 0,
    knowledge_count: 0,
    satisfaction_rate: '98%'
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/stats/platform')
        setStats(response.data)
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }
    fetchStats()
  }, [])

  // 调试信息
  console.log('[Home] 用户信息:', user)
  console.log('[Home] 用户角色:', user?.role)
  console.log('[Home] isEnterprise:', isEnterprise())
  console.log('[Home] isGovernment:', isGovernment())
  console.log('[Home] isUniversity:', isUniversity())
  console.log('[Home] isStudent:', isStudent())

  // 根据用户角色显示不同的功能
  const features = isEnterprise() ? [
    {
      to: '/jobs',
      title: '资源发布',
      description: '发布和管理招聘信息，吸引优秀学生人才'
    },
    {
      to: '/chat',
      title: '企业直聊',
      description: '查看学生咨询消息，与学生实时沟通'
    },
    {
      to: '/knowledge',
      title: '知识库管理',
      description: '管理FAQ知识库，HR离线时智能系统自动回答学生问题'
    },
    {
      to: '/customer-service',
      title: '在线客服',
      description: '24小时在线客服，解答平台使用问题'
    }
  ] : isGovernment() ? [
    {
      to: '/dashboard',
      title: '数据仪表盘',
      description: '实时掌握区域创新动态，进行宏观调控和政策支持'
    },
    {
      to: '/innovation-dynamics',
      title: '创新动态',
      description: '发布和管理区域创新动态信息，促进产学研合作'
    },
    {
      to: '/research-demands',
      title: '研发需求',
      description: '查看企业发布的研发需求，对接技术合作'
    },
    {
      to: '/cooperation-projects',
      title: '合作项目',
      description: '查看产学研合作项目进展，推动成果转化'
    }
  ] : isUniversity() ? [
    {
      to: '/research-achievements',
      title: '研发成果',
      description: '发布和管理高校研发成果，促进成果转化'
    },
    {
      to: '/research-demands',
      title: '研发需求',
      description: '查看企业发布的研发需求，寻找合作机会'
    },
    {
      to: '/technical-barriers',
      title: '技术壁垒',
      description: '查看企业技术壁垒，提供解决方案'
    },
    {
      to: '/customer-service',
      title: '在线客服',
      description: '24小时在线客服，解答平台使用问题'
    }
  ] : [  // 默认（学生）
    {
      to: '/jobs',
      title: '资源匹配',
      description: '浏览企业发布的招聘信息，点击发起沟通与HR对接'
    },
    {
      to: '/chat',
      title: '企业直聊',
      description: '查看与企业HR的聊天会话，继续沟通交流'
    },
    {
      to: '/customer-service',
      title: '在线客服',
      description: '24小时在线客服，解答平台使用问题'
    },
    {
      to: '/profile',
      title: '个人中心',
      description: '管理个人信息，查看历史记录，设置账户偏好'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-blue-900 text-white border-b-4 border-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 border-b-2 border-blue-700 pb-4 inline-block">
              产学研合作服务平台
            </h1>
            <p className="text-lg text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              连接高校与企业，促进人才培养与产业发展深度融合。提供岗位发布、资源共享、实时沟通等核心功能，支持产学研高效合作。
            </p>
            {!isAuthenticated && (
              <div className="flex justify-center gap-4">
                <Link
                  to="/register"
                  className="bg-white text-blue-900 px-8 py-3 font-medium hover:bg-gray-100 border-2 border-white"
                >
                  立即注册
                </Link>
                <Link
                  to="/login"
                  className="bg-blue-800 text-white px-8 py-3 font-medium hover:bg-blue-700 border-2 border-blue-700"
                >
                  登录账号
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <p className="text-blue-200 text-lg">
                欢迎回来，{user?.name || '用户'}！
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Platform Introduction */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-900 inline-block">平台简介</h2>
            <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
              本平台致力于打造高效的产学研合作生态，通过智能化技术手段，为高校学生、科研人员和企业提供便捷的交流与合作渠道。平台支持岗位发布、资源共享、实时沟通等核心功能，并提供智能化服务支持。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 border border-gray-300 bg-gray-50">
              <div className="w-12 h-12 bg-blue-900 flex items-center justify-center mx-auto mb-4 rounded-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">学生用户</h3>
              <p className="text-gray-600 text-sm">
                浏览企业岗位，与HR直接沟通，获取实习和就业机会
              </p>
            </div>
            <div className="text-center p-6 border border-gray-300 bg-gray-50">
              <div className="w-12 h-12 bg-blue-900 flex items-center justify-center mx-auto mb-4 rounded-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">企业用户</h3>
              <p className="text-gray-600 text-sm">
                发布岗位需求，管理招聘流程，对接高校优质人才
              </p>
            </div>
            <div className="text-center p-6 border border-gray-300 bg-gray-50">
              <div className="w-12 h-12 bg-blue-900 flex items-center justify-center mx-auto mb-4 rounded-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">在线客服</h3>
              <p className="text-gray-600 text-sm">
                7×24小时在线客服支持，HR离线时自动回复
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-900 inline-block">核心功能</h2>
            <p className="text-gray-600">
              一站式产学研合作服务平台
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <FeatureCard key={feature.to} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-6 border border-gray-300 bg-gray-50">
              <div className="text-3xl font-bold text-blue-900 mb-2">{stats.enterprise_count}</div>
              <div className="text-gray-600">合作企业</div>
            </div>
            <div className="p-6 border border-gray-300 bg-gray-50">
              <div className="text-3xl font-bold text-blue-900 mb-2">{stats.student_count}</div>
              <div className="text-gray-600">注册学生</div>
            </div>
            <div className="p-6 border border-gray-300 bg-gray-50">
              <div className="text-3xl font-bold text-blue-900 mb-2">{stats.job_count}</div>
              <div className="text-gray-600">岗位发布</div>
            </div>
            <div className="p-6 border border-gray-300 bg-gray-50">
              <div className="text-3xl font-bold text-blue-900 mb-2">{stats.satisfaction_rate}</div>
              <div className="text-gray-600">用户满意度</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
