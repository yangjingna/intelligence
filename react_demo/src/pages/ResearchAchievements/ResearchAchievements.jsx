import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { researchAchievementsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { ACHIEVEMENT_STATUS } from '../../utils/constants'

const ResearchAchievements = () => {
  const { user, isAuthenticated, isUniversity } = useUserStore()
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [researchArea, setResearchArea] = useState('')
  const [applicationField, setApplicationField] = useState('')

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (researchArea) params.research_area = researchArea
      if (applicationField) params.application_field = applicationField

      const response = await researchAchievementsAPI.getAchievements(params)
      setAchievements(response.data)
    } catch (error) {
      console.error('获取研发成果失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAchievements()
  }, [])

  const handleSearch = () => {
    fetchAchievements()
  }

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-600'
    }
    const labels = {
      draft: '草稿',
      published: '已发布',
      archived: '已归档'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.draft}`}>
        {labels[status] || '草稿'}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">研发成果</h1>
        {isUniversity && (
          <Link
            to="/research-achievements/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            发布成果
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
            <input
              type="text"
              placeholder="应用领域"
              value={applicationField}
              onChange={(e) => setApplicationField(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

      {/* 成果列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : achievements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无研发成果
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-500">{achievement.university_name}</span>
                {getStatusBadge(achievement.status)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{achievement.title}</h3>
              {achievement.research_area && (
                <div className="mb-2">
                  <span className="inline-block bg-green-50 text-green-700 px-2 py-1 rounded text-xs">
                    {achievement.research_area}
                  </span>
                </div>
              )}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {achievement.description}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>浏览 {achievement.view_count}</span>
                <Link
                  to={`/research-achievements/${achievement.id}`}
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

export default ResearchAchievements
