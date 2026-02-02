import { useState, useEffect } from 'react'
import { innovationDynamicsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'

const InnovationDynamics = () => {
  const { user, isAuthenticated, isGovernment } = useUserStore()
  const [dynamics, setDynamics] = useState([])
  const [stats, setStats] = useState({
    total_demands: 0,
    total_barriers: 0,
    total_achievements: 0,
    total_projects: 0,
    solved_barriers: 0,
    completed_projects: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [region, setRegion] = useState('')

  const fetchDynamics = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (filterType) params.dynamic_type = filterType
      if (region) params.region = region

      const [dynamicsRes, statsRes] = await Promise.all([
        innovationDynamicsAPI.getDynamics(params),
        innovationDynamicsAPI.getStats()
      ])
      setDynamics(dynamicsRes.data)
      setStats(statsRes.data)
    } catch (error) {
      console.error('获取创新动态失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDynamics()
  }, [])

  const handleSearch = () => {
    fetchDynamics()
  }

  // 计算额外指标
  const calculateMetrics = () => {
    const solutionRate = stats.total_barriers > 0
      ? ((stats.solved_barriers / stats.total_barriers) * 100).toFixed(1)
      : 0

    const completionRate = stats.total_projects > 0
      ? ((stats.completed_projects / stats.total_projects) * 100).toFixed(1)
      : 0

    const totalActivities = stats.total_demands + stats.total_barriers + stats.total_achievements

    return { solutionRate, completionRate, totalActivities }
  }

  const metrics = calculateMetrics()

  // 模拟趋势数据（实际项目中应从后端获取）
  const trendData = [
    { label: '需求发布', value: stats.total_demands, color: 'bg-blue-500' },
    { label: '壁垒发布', value: stats.total_barriers, color: 'bg-purple-500' },
    { label: '成果发布', value: stats.total_achievements, color: 'bg-green-500' },
    { label: '项目签约', value: stats.total_projects, color: 'bg-indigo-500' }
  ]

  // 模拟热门研究领域（实际项目中应从后端获取统计）
  const getPopularAreas = () => {
    const areas = {}
    dynamics.forEach(d => {
      if (d.keywords) {
        d.keywords.forEach(keyword => {
          areas[keyword] = (areas[keyword] || 0) + 1
        })
      }
    })
    return Object.entries(areas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }

  const popularAreas = getPopularAreas()

  // 模拟区域分布（实际项目中应从后端获取）
  const getRegionDistribution = () => {
    const regions = {}
    dynamics.forEach(d => {
      if (d.region) {
        regions[d.region] = (regions[d.region] || 0) + 1
      }
    })
    return Object.entries(regions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }

  const regionData = getRegionDistribution()

  const getTypeBadge = (type) => {
    const colors = {
      demand_published: 'bg-blue-100 text-blue-800',
      barrier_published: 'bg-purple-100 text-purple-800',
      achievement_published: 'bg-green-100 text-green-800',
      project_signed: 'bg-indigo-100 text-indigo-800',
      project_completed: 'bg-teal-100 text-teal-800',
      barrier_solved: 'bg-orange-100 text-orange-800'
    }
    const labels = {
      demand_published: '需求发布',
      barrier_published: '壁垒发布',
      achievement_published: '成果发布',
      project_signed: '项目签约',
      project_completed: '项目完成',
      barrier_solved: '壁垒解决'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || '未知'}
      </span>
    )
  }

  if (!isGovernment()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">
          只有政府用户可以查看创新动态
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">创新动态</h1>
      <p className="text-gray-600 mb-8">实时掌握区域创新动态，进行宏观调控和政策支持</p>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">研发需求</div>
          <div className="text-2xl font-bold text-blue-600">{stats.total_demands}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">技术壁垒</div>
          <div className="text-2xl font-bold text-purple-600">{stats.total_barriers}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">已解决壁垒</div>
          <div className="text-2xl font-bold text-orange-600">{stats.solved_barriers}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">研发成果</div>
          <div className="text-2xl font-bold text-green-600">{stats.total_achievements}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">合作项目</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.total_projects}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-sm text-gray-500 mb-1">已完成项目</div>
          <div className="text-2xl font-bold text-teal-600">{stats.completed_projects}</div>
        </div>
      </div>

      {/* 分析指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">技术壁垒解决率</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-4xl font-bold mb-2">{metrics.solutionRate}%</div>
          <div className="text-sm opacity-90">
            已解决 {stats.solved_barriers} / 总数 {stats.total_barriers}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">项目完成率</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-4xl font-bold mb-2">{metrics.completionRate}%</div>
          <div className="text-sm opacity-90">
            已完成 {stats.completed_projects} / 总数 {stats.total_projects}
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">创新活动总量</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-4xl font-bold mb-2">{metrics.totalActivities}</div>
          <div className="text-sm opacity-90">
            各类创新发布总次数
          </div>
        </div>
      </div>

      {/* 趋势分析 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">创新活动趋势</h2>
        <div className="space-y-4">
          {trendData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm text-gray-600">{item.label}</div>
              <div className="flex-1 mx-4">
                <div className="h-8 bg-gray-100 rounded overflow-hidden relative">
                  <div
                    className={`h-full ${item.color} transition-all duration-500`}
                    style={{ width: `${Math.min((item.value / (metrics.totalActivities || 1)) * 100, 100)}%` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-gray-700">
                    {item.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 热门领域和区域分布 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {popularAreas.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">热门研究领域</h2>
            <div className="space-y-3">
              {popularAreas.map((area, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs text-white ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-gray-700">{area.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(area.count / popularAreas[0]?.count || 1) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{area.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {regionData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">区域分布</h2>
            <div className="space-y-3">
              {regionData.map((region, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                    <span className="text-gray-700">{region.name || '未指定'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${(region.count / regionData[0]?.count || 1) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{region.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 政策建议 */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 mb-8 border border-amber-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          宏观调控建议
        </h2>
        <div className="space-y-3">
          {metrics.solutionRate < 50 && (
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">
                技术壁垒解决率较低（{metrics.solutionRate}%），建议加大产学研对接支持力度，组织技术攻关活动
              </span>
            </div>
          )}
          {metrics.completionRate < 50 && (
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 mt-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">
                项目完成率有待提高（{metrics.completionRate}%），建议完善项目管理机制，提供项目跟踪服务
              </span>
            </div>
          )}
          {stats.total_achievements < stats.total_demands && (
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 mt-1.5 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">
                研发成果数量少于需求，建议加大对高校科研的投入和支持，鼓励成果转化
              </span>
            </div>
          )}
          {metrics.solutionRate >= 70 && (
            <div className="flex items-start gap-2 text-sm">
              <div className="w-2 h-2 mt-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700">
                技术壁垒解决率良好（{metrics.solutionRate}%），产学研合作活跃，建议继续优化创新环境
              </span>
            </div>
          )}
        </div>
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
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部类型</option>
              <option value="demand_published">需求发布</option>
              <option value="barrier_published">壁垒发布</option>
              <option value="achievement_published">成果发布</option>
              <option value="project_signed">项目签约</option>
              <option value="project_completed">项目完成</option>
              <option value="barrier_solved">壁垒解决</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="区域"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
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

      {/* 动态列表 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最新动态</h2>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : dynamics.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无创新动态
          </div>
        ) : (
          <div className="space-y-4">
            {dynamics.map((dynamic) => (
              <div key={dynamic.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">{dynamic.title}</h3>
                    <div className="flex items-center gap-3 mb-1">
                      {getTypeBadge(dynamic.dynamic_type)}
                      {dynamic.region && (
                        <span className="text-xs text-gray-500">{dynamic.region}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {new Date(dynamic.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                {dynamic.description && (
                  <p className="text-gray-600 text-sm mb-2">
                    {dynamic.description}
                  </p>
                )}
                {dynamic.keywords && dynamic.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {dynamic.keywords.map((keyword, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InnovationDynamics
