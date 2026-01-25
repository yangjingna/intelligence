import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { formatDate } from '../../utils/helpers'

const JobCard = ({ job, onStartChat, isEnterprise }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          <p className="text-blue-600 font-medium">{job.company}</p>
        </div>
        <span className="text-orange-500 font-semibold">{job.salary}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.tags?.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
          >
            {tag}
          </span>
        ))}
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>{job.location}</span>
          <span>{job.experience}</span>
        </div>
        <span>发布于 {formatDate(job.createdAt)}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {job.hrName?.charAt(0) || 'H'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{job.hrName || 'HR'}</p>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  job.hrOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-500">
                {job.hrOnline ? '在线' : '离线'}
              </span>
            </div>
          </div>
        </div>

        {!isEnterprise && (
          <button
            onClick={() => onStartChat(job)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            立即沟通
          </button>
        )}

        {isEnterprise && (
          <Link
            to={`/jobs/edit/${job.id}`}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            编辑岗位
          </Link>
        )}
      </div>
    </div>
  )
}

const Jobs = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useUserStore()
  const isEnterprise = user?.role === 'enterprise'

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [showMyJobs, setShowMyJobs] = useState(false)

  useEffect(() => {
    fetchJobs()
  }, [showMyJobs])

  // 默认岗位数据
  const defaultJobs = [
    {
      id: 1,
      title: '前端开发工程师',
      company: '科技创新有限公司',
      salary: '15k-25k',
      location: '北京',
      experience: '1-3年',
      description: '负责公司前端产品的开发与维护，参与技术方案设计，使用React/Vue等主流框架进行开发。',
      tags: ['React', 'Vue', 'TypeScript'],
      hrName: '张经理',
      hrOnline: true,
      hrId: 101,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: '后端开发工程师',
      company: '智慧教育科技',
      salary: '18k-30k',
      location: '上海',
      experience: '3-5年',
      description: '负责后端服务架构设计与开发，优化系统性能，保障服务稳定性。',
      tags: ['Python', 'Java', 'MySQL'],
      hrName: '李经理',
      hrOnline: false,
      hrId: 102,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: '算法工程师',
      company: '人工智能研究院',
      salary: '25k-40k',
      location: '深圳',
      experience: '3-5年',
      description: '从事机器学习算法研究与落地，参与大模型训练与优化。',
      tags: ['Python', 'PyTorch', 'LLM'],
      hrName: '王经理',
      hrOnline: true,
      hrId: 103,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      title: '产品经理',
      company: '互联网金融集团',
      salary: '20k-35k',
      location: '杭州',
      experience: '3-5年',
      description: '负责产品规划与设计，推动产品迭代，协调研发资源。',
      tags: ['产品设计', 'Axure', '数据分析'],
      hrName: '赵经理',
      hrOnline: true,
      hrId: 104,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      title: '数据分析师',
      company: '大数据科技公司',
      salary: '15k-28k',
      location: '北京',
      experience: '1-3年',
      description: '负责数据采集、清洗、分析，输出数据报告，支持业务决策。',
      tags: ['SQL', 'Python', 'Tableau'],
      hrName: '孙经理',
      hrOnline: false,
      hrId: 105,
      createdAt: new Date().toISOString()
    },
    {
      id: 6,
      title: '嵌入式软件工程师',
      company: '智能硬件科技',
      salary: '18k-32k',
      location: '深圳',
      experience: '3-5年',
      description: '负责嵌入式系统软件开发，驱动程序编写，系统调试优化。',
      tags: ['C/C++', 'Linux', 'ARM'],
      hrName: '周经理',
      hrOnline: true,
      hrId: 106,
      createdAt: new Date().toISOString()
    }
  ]

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = showMyJobs && isEnterprise
        ? await jobsAPI.getMyJobs()
        : await jobsAPI.getJobs({ search: searchTerm, location: filterLocation })
      const data = response.data || []
      setJobs(data.length > 0 ? data : defaultJobs)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      setJobs(defaultJobs)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = (job) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    navigate(`/chat?jobId=${job.id}&hrId=${job.hrId}`)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchJobs()
  }

  const filteredJobs = jobs.filter(job => {
    const matchSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchLocation = !filterLocation || job.location === filterLocation
    return matchSearch && matchLocation
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEnterprise ? '岗位管理' : '岗位招聘'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEnterprise ? '管理您发布的岗位信息' : '发现适合您的工作机会'}
          </p>
        </div>
        {isEnterprise && (
          <Link
            to="/jobs/create"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            发布岗位
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
              placeholder="搜索岗位名称或公司..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部地区</option>
            <option value="北京">北京</option>
            <option value="上海">上海</option>
            <option value="深圳">深圳</option>
            <option value="杭州">杭州</option>
            <option value="广州">广州</option>
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
              onClick={() => setShowMyJobs(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                !showMyJobs
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部岗位
            </button>
            <button
              onClick={() => setShowMyJobs(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                showMyJobs
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              我的岗位
            </button>
          </div>
        )}
      </div>

      {/* Job List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📋</div>
          <p className="text-gray-600">暂无岗位信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onStartChat={handleStartChat}
              isEnterprise={isEnterprise}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Jobs
