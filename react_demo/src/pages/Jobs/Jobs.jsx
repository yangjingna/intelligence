import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { jobsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { formatDate } from '../../utils/helpers'

const JobCard = ({ job, onStartChat, isEnterprise }) => {
  // 兼容后端返回的 snake_case 字段名
  const hrName = job.hr_name || job.hrName || 'HR'
  const hrOnline = job.hr_online ?? job.hrOnline ?? false
  const createdAt = job.created_at || job.createdAt

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
        <span>发布于 {formatDate(createdAt)}</span>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-medium">
              {hrName.charAt(0)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{hrName}</p>
            <div className="flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  hrOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-500">
                {hrOnline ? '在线' : '离线'}
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

  const fetchJobs = async () => {
    setLoading(true)
    try {
      let response
      if (showMyJobs && isEnterprise) {
        try {
          response = await jobsAPI.getMyJobs()
        } catch (myJobsError) {
          console.warn('Failed to fetch my jobs, falling back to all:', myJobsError)
          setShowMyJobs(false)
          response = await jobsAPI.getJobs({ search: searchTerm, location: filterLocation })
        }
      } else {
        response = await jobsAPI.getJobs({ search: searchTerm, location: filterLocation })
      }
      setJobs(response.data || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = (job) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    // 兼容后端返回的 hr_id 字段名
    const hrId = job.hrId || job.hr_id
    navigate(`/chat?jobId=${job.id}&hrId=${hrId}`)
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
