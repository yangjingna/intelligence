import { Link } from 'react-router-dom'
import useUserStore from '../../stores/userStore'

const FeatureCard = ({ to, icon, title, description, color }) => (
  <Link
    to={to}
    className={`block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1`}
  >
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
      <span className="text-2xl">{icon}</span>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </Link>
)

const Home = () => {
  const { isAuthenticated, user, isEnterprise, isGovernment, isUniversity, isStudent } = useUserStore()

  // 根据用户角色显示不同的功能
  const features = isEnterprise() ? [
    {
      to: '/jobs',
      icon: '📚',
      title: '资源发布',
      description: '发布和管理招聘信息，吸引优秀学生人才',
      color: 'bg-blue-100'
    },
    {
      to: '/chat',
      icon: '💬',
      title: '企业直聊',
      description: '查看学生咨询消息，与学生实时沟通',
      color: 'bg-green-100'
    },
    {
      to: '/knowledge',
      icon: '📖',
      title: '知识库管理',
      description: '管理FAQ知识库，HR离线时AI自动回答学生问题',
      color: 'bg-yellow-100'
    },
    {
      to: '/customer-service',
      icon: '🤖',
      title: '智能客服',
      description: '24小时在线智能客服，解答平台使用问题',
      color: 'bg-purple-100'
    }
  ] : isGovernment() ? [
    {
      to: '/innovation-dynamics',
      icon: '📊',
      title: '创新动态',
      description: '发布和管理区域创新动态信息，促进产学研合作',
      color: 'bg-blue-100'
    },
    {
      to: '/research-demands',
      icon: '🔍',
      title: '研发需求',
      description: '查看企业发布的研发需求，对接技术合作',
      color: 'bg-green-100'
    },
    {
      to: '/technical-barriers',
      icon: '🚧',
      title: '技术壁垒',
      description: '了解企业面临的技术壁垒，提供政策支持',
      color: 'bg-orange-100'
    },
    {
      to: '/cooperation-projects',
      icon: '🤝',
      title: '合作项目',
      description: '查看产学研合作项目进展，推动成果转化',
      color: 'bg-purple-100'
    }
  ] : isUniversity() ? [
    {
      to: '/research-achievements',
      icon: '🎓',
      title: '研发成果',
      description: '发布和管理高校研发成果，促进成果转化',
      color: 'bg-blue-100'
    },
    {
      to: '/research-demands',
      icon: '🔍',
      title: '研发需求',
      description: '查看企业发布的研发需求，寻找合作机会',
      color: 'bg-green-100'
    },
    {
      to: '/technical-barriers',
      icon: '🚧',
      title: '技术壁垒',
      description: '查看企业技术壁垒，提供解决方案',
      color: 'bg-orange-100'
    },
    {
      to: '/customer-service',
      icon: '🤖',
      title: '智能客服',
      description: '24小时在线智能客服，解答平台使用问题',
      color: 'bg-purple-100'
    }
  ] : [  // 默认（学生）
    {
      to: '/jobs',
      icon: '📚',
      title: '资源匹配',
      description: '浏览企业发布的招聘信息，点击发起沟通与HR对接',
      color: 'bg-blue-100'
    },
    {
      to: '/chat',
      icon: '💬',
      title: '企业直聊',
      description: '查看与企业HR的聊天会话，继续沟通交流',
      color: 'bg-green-100'
    },
    {
      to: '/customer-service',
      icon: '🤖',
      title: '智能客服',
      description: '24小时在线智能客服，解答平台使用问题',
      color: 'bg-purple-100'
    },
    {
      to: '/profile',
      icon: '👤',
      title: '个人中心',
      description: '管理个人信息，查看历史记录，设置账户偏好',
      color: 'bg-orange-100'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              产学研智能交互系统
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              基于大模型的智能化产学研合作平台，连接高校与企业，促进人才培养与产业发展深度融合
            </p>
            {!isAuthenticated && (
              <div className="flex justify-center gap-4">
                <Link
                  to="/register"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  立即注册
                </Link>
                <Link
                  to="/login"
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors border border-blue-400"
                >
                  登录账号
                </Link>
              </div>
            )}
            {isAuthenticated && (
              <p className="text-blue-100">
                欢迎回来，{user?.name || '用户'}！
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Platform Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">平台简介</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              本平台致力于打造高效的产学研合作生态，通过智能化技术手段，为高校学生、科研人员和企业提供便捷的交流与合作渠道。平台支持岗位发布、资源共享、实时沟通等核心功能，并借助大语言模型提供智能化服务支持。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">学生用户</h3>
              <p className="text-gray-600 text-sm">
                浏览企业岗位，与HR直接沟通，获取实习和就业机会
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">企业用户</h3>
              <p className="text-gray-600 text-sm">
                发布岗位需求，管理招聘流程，对接高校优质人才
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🤝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">智能助手</h3>
              <p className="text-gray-600 text-sm">
                7×24小时智能客服支持，HR离线时智能体自动回复
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">核心功能</h2>
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
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <div className="text-gray-600">合作企业</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10000+</div>
              <div className="text-gray-600">注册学生</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">2000+</div>
              <div className="text-gray-600">岗位发布</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <div className="text-gray-600">用户满意度</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
