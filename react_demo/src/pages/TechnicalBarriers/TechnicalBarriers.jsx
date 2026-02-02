import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { technicalBarriersAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { BARRIER_STATUS } from '../../utils/constants'

const TechnicalBarriers = () => {
  const { user, isAuthenticated } = useUserStore()
  const [barriers, setBarriers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [technicalArea, setTechnicalArea] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState('')

  const fetchBarriers = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (technicalArea) params.technical_area = technicalArea
      if (filterDifficulty) params.difficulty = filterDifficulty

      const response = await technicalBarriersAPI.getBarriers(params)
      setBarriers(response.data)
    } catch (error) {
      console.error('获取技术壁垒失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBarriers()
  }, [])

  const handleSearch = () => {
    fetchBarriers()
  }

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      very_high: 'bg-red-100 text-red-800'
    }
    const labels = {
      low: '低',
      medium: '中',
      high: '高',
      very_high: '极高'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[difficulty] || colors.medium}`}>
        {labels[difficulty] || '中'}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">技术壁垒</h1>
        {user?.role === 'enterprise' && (
          <Link
            to="/technical-barriers/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            发布技术壁垒
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
              placeholder="技术领域"
              value={technicalArea}
              onChange={(e) => setTechnicalArea(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部难度</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="very_high">极高</option>
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

      {/* 壁垒列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : barriers.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无技术壁垒
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barriers.map((barrier) => (
            <div key={barrier.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-500">{barrier.enterprise_name}</span>
                {getDifficultyBadge(barrier.difficulty)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{barrier.title}</h3>
              {barrier.technical_area && (
                <div className="mb-2">
                  <span className="inline-block bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs">
                    {barrier.technical_area}
                  </span>
                </div>
              )}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {barrier.description}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>浏览 {barrier.view_count}</span>
                <Link
                  to={`/technical-barriers/${barrier.id}`}
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

export default TechnicalBarriers
