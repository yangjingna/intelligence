import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { inquiryRecordsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { INQUIRY_STATUS } from '../../utils/constants'

const Inquiries = () => {
  const { user, isAuthenticated } = useUserStore()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search) params.search = search
      if (filterType) params.inquiry_type = filterType
      if (filterStatus) params.status = filterStatus

      const response = await inquiryRecordsAPI.getInquiries(params)
      setInquiries(response.data)
    } catch (error) {
      console.error('获取咨询记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  const handleSearch = () => {
    fetchInquiries()
  }

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      responded: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    }
    const labels = {
      pending: '待回复',
      responded: '已回复',
      resolved: '已解决',
      closed: '已关闭'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {labels[status] || '待回复'}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">咨询记录</h1>
        {isAuthenticated && (
          <button
            onClick={() => alert('发起咨询功能将在详情页面实现')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            发起咨询
          </button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="搜索主题或内容"
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
              <option value="demand">研发需求</option>
              <option value="barrier">技术壁垒</option>
              <option value="achievement">研发成果</option>
            </select>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="pending">待回复</option>
              <option value="responded">已回复</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
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

      {/* 咨询列表 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无咨询记录
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm">
          {inquiries.map((inquiry) => (
            <div key={inquiry.id} className="border-b border-gray-200 last:border-0 p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{inquiry.subject}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {inquiry.inquirer_role === 'university' ? '高校' :
                       inquiry.inquirer_role === 'enterprise' ? '企业' : inquiry.inquirer_role}
                    </span>
                    <span className="text-xs text-gray-500">{inquiry.inquirer_name}</span>
                  </div>
                </div>
                {getStatusBadge(inquiry.status)}
              </div>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {inquiry.content}
              </p>
              {inquiry.response && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">回复：</span>
                    {inquiry.response}
                  </p>
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>浏览 {inquiry.view_count}</span>
                <Link
                  to={`/inquiry-records/${inquiry.id}`}
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

export default Inquiries
