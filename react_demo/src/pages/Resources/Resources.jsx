import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resourcesAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { formatDate } from '../../utils/helpers'
import { RESOURCE_TYPES } from '../../utils/constants'

const resourceTypeLabels = {
  [RESOURCE_TYPES.PROJECT]: '项目合作',
  [RESOURCE_TYPES.INTERNSHIP]: '实习机会',
  [RESOURCE_TYPES.RESEARCH]: '科研项目',
  [RESOURCE_TYPES.COOPERATION]: '产学研合作'
}

const resourceTypeColors = {
  [RESOURCE_TYPES.PROJECT]: 'bg-blue-100 text-blue-600',
  [RESOURCE_TYPES.INTERNSHIP]: 'bg-green-100 text-green-600',
  [RESOURCE_TYPES.RESEARCH]: 'bg-purple-100 text-purple-600',
  [RESOURCE_TYPES.COOPERATION]: 'bg-orange-100 text-orange-600'
}

const ResourceCard = ({ resource, onContact, isEnterprise }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span
            className={`inline-block px-2 py-1 text-xs rounded ${
              resourceTypeColors[resource.type] || 'bg-gray-100 text-gray-600'
            } mb-2`}
          >
            {resourceTypeLabels[resource.type] || resource.type}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
          <p className="text-blue-600">{resource.company}</p>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{resource.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {resource.tags?.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>发布于 {formatDate(resource.createdAt)}</span>
        {resource.deadline && (
          <span className="text-orange-500">截止：{formatDate(resource.deadline)}</span>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {resource.contactName?.charAt(0) || 'C'}
            </span>
          </div>
          <span className="text-sm text-gray-600">{resource.contactName || '联系人'}</span>
        </div>

        {!isEnterprise ? (
          <button
            onClick={() => onContact(resource)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即沟通
          </button>
        ) : (
          <Link
            to={`/resources/edit/${resource.id}`}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            编辑资源
          </Link>
        )}
      </div>
    </div>
  )
}

const Resources = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useUserStore()
  const isEnterprise = user?.role === 'enterprise'

  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showMyResources, setShowMyResources] = useState(false)

  useEffect(() => {
    fetchResources()
  }, [showMyResources])

  // 默认资源数据
  const defaultResources = [
    {
      id: 1,
      title: '智能制造产学研合作项目',
      type: RESOURCE_TYPES.COOPERATION,
      company: '科技创新集团',
      description: '寻求高校合作，共同开展智能制造领域的技术研发，包括机器人控制、视觉识别、智能检测等方向。提供充足研发经费和实验设备。',
      tags: ['智能制造', '机器人', '产学研'],
      contactName: '王工程师',
      contactId: 201,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 30 * 24 * 3600000).toISOString()
    },
    {
      id: 2,
      title: '大数据分析实习生招募',
      type: RESOURCE_TYPES.INTERNSHIP,
      company: '数据科技有限公司',
      description: '招募数据科学相关专业的实习生，参与公司核心数据分析项目。提供实习补贴，表现优秀者可转正。',
      tags: ['大数据', '数据分析', 'Python'],
      contactName: '李HR',
      contactId: 202,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: 'AI应用研究联合项目',
      type: RESOURCE_TYPES.RESEARCH,
      company: '人工智能研究院',
      description: '与高校联合开展人工智能应用研究，涉及自然语言处理、计算机视觉等前沿领域。可提供联合培养博士生机会。',
      tags: ['AI', 'NLP', '计算机视觉'],
      contactName: '陈教授',
      contactId: 203,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      title: '新能源汽车技术合作',
      type: RESOURCE_TYPES.PROJECT,
      company: '新能源汽车科技',
      description: '寻求电池管理系统、电机控制等方向的技术合作，共同开发新一代新能源汽车核心技术。',
      tags: ['新能源', '汽车', '电池技术'],
      contactName: '刘工程师',
      contactId: 204,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 60 * 24 * 3600000).toISOString()
    },
    {
      id: 5,
      title: '区块链技术研究实习',
      type: RESOURCE_TYPES.INTERNSHIP,
      company: '金融科技集团',
      description: '招募区块链、密码学相关专业学生，参与分布式账本技术研究与应用开发。',
      tags: ['区块链', '密码学', 'Go'],
      contactName: '张经理',
      contactId: 205,
      createdAt: new Date().toISOString()
    },
    {
      id: 6,
      title: '医疗AI影像诊断系统',
      type: RESOURCE_TYPES.RESEARCH,
      company: '智慧医疗研究中心',
      description: '联合开发医疗影像AI辅助诊断系统，涉及CT、MRI图像分析，寻求医学院校和计算机学院合作。',
      tags: ['医疗AI', '图像识别', '深度学习'],
      contactName: '吴研究员',
      contactId: 206,
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 45 * 24 * 3600000).toISOString()
    }
  ]

  const fetchResources = async () => {
    setLoading(true)
    try {
      const response = showMyResources && isEnterprise
        ? await resourcesAPI.getMyResources()
        : await resourcesAPI.getResources({ search: searchTerm, type: filterType })
      const data = response.data || []
      setResources(data.length > 0 ? data : defaultResources)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
      setResources(defaultResources)
    } finally {
      setLoading(false)
    }
  }

  const handleContact = (resource) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(`/chat?resourceId=${resource.id}&contactId=${resource.contactId}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchResources()
  }

  const filteredResources = resources.filter(resource => {
    const matchSearch = !searchTerm ||
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchType = !filterType || resource.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEnterprise ? '资源发布' : '资源匹配'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEnterprise ? '发布和管理您的产学研资源' : '发现适合您的产学研合作机会'}
          </p>
        </div>
        {isEnterprise && (
          <Link
            to="/resources/create"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            发布资源
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索资源名称或公司..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            {Object.entries(resourceTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>
        </form>

        {isEnterprise && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowMyResources(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                !showMyResources
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部资源
            </button>
            <button
              onClick={() => setShowMyResources(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showMyResources
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              我的资源
            </button>
          </div>
        )}
      </div>

      {/* Resource List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📦</div>
          <p className="text-gray-600">暂无资源信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onContact={handleContact}
              isEnterprise={isEnterprise}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Resources
