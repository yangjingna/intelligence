import { useState, useEffect } from 'react'
import { innovationDynamicsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'

const StatCard = ({ title, value, color, icon, trend }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
        <span className="text-2xl">{icon}</span>
      </div>
      {trend !== undefined && (
        <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-sm text-gray-500 mb-1">{title}</div>
    <div className="text-3xl font-bold text-gray-900">{value}</div>
  </div>
)

const ProgressBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="text-gray-500">{value}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-right text-sm text-gray-500">{percentage}%</div>
    </div>
  )
}

const TrendChart = ({ data, title }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="flex items-end justify-between h-40 gap-2">
      {data.map((item, index) => {
        const maxValue = Math.max(...data.map(d => d.value), 1)
        const height = (item.value / maxValue) * 100
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className={`w-full ${item.color} rounded-t transition-all duration-300 hover:opacity-80`}
              style={{ height: `${height}%` }}
            ></div>
            <div className="text-xs text-gray-500 mt-2">{item.label}</div>
            <div className="text-sm font-medium text-gray-700">{item.value}</div>
          </div>
        )
      })}
    </div>
  </div>
)

const Dashboard = () => {
  const { isGovernment } = useUserStore()
  const [stats, setStats] = useState({
    total_demands: 0,
    total_barriers: 0,
    total_achievements: 0,
    total_projects: 0,
    solved_barriers: 0,
    completed_projects: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[Dashboard] 开始获取统计数据')
      const res = await innovationDynamicsAPI.getStats()
      console.log('[Dashboard] 统计数据:', res.data)
      setStats(res.data)
    } catch (error) {
      console.error('[Dashboard] 获取统计数据失败:', error)
      setError('获取统计数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 计算指标
  const metrics = {
    solutionRate: stats.total_barriers > 0
      ? ((stats.solved_barriers / stats.total_barriers) * 100).toFixed(1)
      : 0,
    completionRate: stats.total_projects > 0
      ? ((stats.completed_projects / stats.total_projects) * 100).toFixed(1)
      : 0,
    totalActivities: stats.total_demands + stats.total_barriers + stats.total_achievements
  }

  // 模拟趋势数据
  const trendData = {
    '7d': [
      { label: '周一', value: Math.floor(stats.total_demands * 0.12), color: 'bg-blue-500' },
      { label: '周二', value: Math.floor(stats.total_demands * 0.15), color: 'bg-blue-500' },
      { label: '周三', value: Math.floor(stats.total_demands * 0.18), color: 'bg-blue-500' },
      { label: '周四', value: Math.floor(stats.total_demands * 0.14), color: 'bg-blue-500' },
      { label: '周五', value: Math.floor(stats.total_demands * 0.20), color: 'bg-blue-500' },
      { label: '周六', value: Math.floor(stats.total_demands * 0.10), color: 'bg-blue-500' },
      { label: '周日', value: Math.floor(stats.total_demands * 0.11), color: 'bg-blue-500' }
    ],
    '30d': [
      { label: '1-5日', value: Math.floor(stats.total_demands * 0.18), color: 'bg-blue-500' },
      { label: '6-10日', value: Math.floor(stats.total_demands * 0.22), color: 'bg-blue-500' },
      { label: '11-15日', value: Math.floor(stats.total_demands * 0.16), color: 'bg-blue-500' },
      { label: '16-20日', value: Math.floor(stats.total_demands * 0.20), color: 'bg-blue-500' },
      { label: '21-25日', value: Math.floor(stats.total_demands * 0.14), color: 'bg-blue-500' },
      { label: '26-30日', value: Math.floor(stats.total_demands * 0.10), color: 'bg-blue-500' }
    ],
    '90d': [
      { label: '1月', value: Math.floor(stats.total_demands * 0.35), color: 'bg-blue-500' },
      { label: '2月', value: Math.floor(stats.total_demands * 0.28), color: 'bg-blue-500' },
      { label: '3月', value: Math.floor(stats.total_demands * 0.37), color: 'bg-blue-500' }
    ]
  }

  // 模拟各类型分布
  const typeDistribution = [
    { label: '研发需求', value: stats.total_demands, color: 'bg-blue-500' },
    { label: '技术壁垒', value: stats.total_barriers, color: 'bg-purple-500' },
    { label: '研发成果', value: stats.total_achievements, color: 'bg-green-500' },
    { label: '合作项目', value: stats.total_projects, color: 'bg-indigo-500' }
  ]

  // 模拟区域数据
  const regionData = [
    { label: '北京', value: Math.floor(stats.total_demands * 0.25) },
    { label: '上海', value: Math.floor(stats.total_demands * 0.30) },
    { label: '深圳', value: Math.floor(stats.total_demands * 0.20) },
    { label: '杭州', value: Math.floor(stats.total_demands * 0.15) },
    { label: '其他', value: Math.floor(stats.total_demands * 0.10) }
  ]

  if (!isGovernment()) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">
          只有政府用户可以查看数据仪表盘
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={fetchStats}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">数据仪表盘</h1>
        <p className="text-gray-600">实时掌握区域创新动态，进行宏观调控和政策支持</p>
      </div>

      {/* 时间范围选择 */}
      <div className="mb-6 flex gap-2">
        {['7d', '30d', '90d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
          </button>
        ))}
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="研发需求"
          value={stats.total_demands}
          icon="📋"
          color="bg-blue-100"
          trend={12}
        />
        <StatCard
          title="技术壁垒"
          value={stats.total_barriers}
          icon="🚧"
          color="bg-purple-100"
          trend={8}
        />
        <StatCard
          title="研发成果"
          value={stats.total_achievements}
          icon="🎓"
          color="bg-green-100"
          trend={15}
        />
        <StatCard
          title="合作项目"
          value={stats.total_projects}
          icon="🤝"
          color="bg-indigo-100"
          trend={20}
        />
      </div>

      {/* 解决率和完成率 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">技术壁垒解决率</h3>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-5xl font-bold mb-2">{metrics.solutionRate}%</div>
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
          <div className="text-5xl font-bold mb-2">{metrics.completionRate}%</div>
          <div className="text-sm opacity-90">
            已完成 {stats.completed_projects} / 总数 {stats.total_projects}
          </div>
        </div>
      </div>

      {/* 趋势分析 */}
      <TrendChart
        data={trendData[timeRange]}
        title="研发需求趋势"
      />

      {/* 类型分布 */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">类型分布</h3>
        <div className="space-y-4">
          {typeDistribution.map((item, index) => (
            <ProgressBar
              key={index}
              label={item.label}
              value={item.value}
              total={metrics.totalActivities}
              color={item.color}
            />
          ))}
        </div>
      </div>

      {/* 区域分布 */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">区域分布</h3>
        <div className="space-y-4">
          {regionData.map((item, index) => (
            <ProgressBar
              key={index}
              label={item.label}
              value={item.value}
              total={stats.total_demands}
              color="bg-indigo-500"
            />
          ))}
        </div>
      </div>

      {/* 政策建议 */}
      <div className="mt-8 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          政策建议
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.solutionRate < 50 && (
            <div className="flex items-start gap-2 bg-white p-4 rounded-lg">
              <div className="w-2 h-2 mt-2 bg-red-500 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 mb-1">技术壁垒解决率偏低</div>
                <div className="text-sm text-gray-600">
                  当前解决率为 {metrics.solutionRate}%，建议加大产学研对接支持力度，组织技术攻关活动
                </div>
              </div>
            </div>
          )}
          {metrics.completionRate < 50 && (
            <div className="flex items-start gap-2 bg-white p-4 rounded-lg">
              <div className="w-2 h-2 mt-2 bg-red-500 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 mb-1">项目完成率待提升</div>
                <div className="text-sm text-gray-600">
                  当前完成率为 {metrics.completionRate}%，建议完善项目管理机制，提供项目跟踪服务
                </div>
              </div>
            </div>
          )}
          {stats.total_achievements < stats.total_demands && (
            <div className="flex items-start gap-2 bg-white p-4 rounded-lg">
              <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 mb-1">成果转化不足</div>
                <div className="text-sm text-gray-600">
                  研发成果数量少于需求，建议加大对高校科研的投入和支持，鼓励成果转化
                </div>
              </div>
            </div>
          )}
          {metrics.solutionRate >= 70 && (
            <div className="flex items-start gap-2 bg-white p-4 rounded-lg">
              <div className="w-2 h-2 mt-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <div>
                <div className="font-medium text-gray-900 mb-1">产学研合作活跃</div>
                <div className="text-sm text-gray-600">
                  技术壁垒解决率良好（{metrics.solutionRate}%），建议继续优化创新环境
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/innovation-dynamics'}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-medium text-gray-900">创新动态</div>
          </button>
          <button
            onClick={() => window.location.href = '/research-demands'}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">📋</div>
            <div className="text-sm font-medium text-gray-900">研发需求</div>
          </button>
          <button
            onClick={() => window.location.href = '/technical-barriers'}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🚧</div>
            <div className="text-sm font-medium text-gray-900">技术壁垒</div>
          </button>
          <button
            onClick={() => window.location.href = '/research-achievements'}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
          >
            <div className="text-2xl mb-2">🎓</div>
            <div className="text-sm font-medium text-gray-900">研发成果</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
