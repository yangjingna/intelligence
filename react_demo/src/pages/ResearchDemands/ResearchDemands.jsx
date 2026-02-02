import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { researchDemandsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { DEMAND_STATUS, DEMAND_PRIORITY } from '../../utils/constants'

const ResearchDemands = () => {
  const { user, isAuthenticated, isEnterprise } = useUserStore()
  const [demands, setDemands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [researchArea, setResearchArea] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const fetchDemands = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (researchArea) params.research_area = researchArea
      if (filterPriority) params.priority = filterPriority

      const response = await researchDemandsAPI.getDemands(params)
      setDemands(response.data)
    } catch (error) {
      console.error('获取研发需求失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDemands()
  }, [])

  const handleSearch = () => {
    fetchDemands()
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    }
    const labels = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority] || colors.medium}`}>
        {labels[priority] || '中'}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">研发需求</h1>
        {isEnterprise && (
          <Link
            to="/research-demands/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            发布新需求
          </Link>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="搜索标题或描述"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="研究领域"
              value={researchArea}
              onChange={(e) => setResearchArea(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部优先级</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </div>
          <div>
            <button
              onClick={handleSearch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 需求列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : demands.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无研发需求
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demands.map((demand) => (
            <div key={demand.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-500">{demand.enterprise_name}</span>
                {getPriorityBadge(demand.priority)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{demand.title}</h3>
              {demand.research_area && (
                <div className="mb-2">
                  <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">
                    {demand.research_area}
                  </span>
                </div>
              )}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {demand.description}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>浏览 {demand.view_count}</span>
                <Link
                  to={`/research-demands/${demand.id}`}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  查看详情
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ResearchDemands
