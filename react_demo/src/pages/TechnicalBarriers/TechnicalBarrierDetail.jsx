import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { technicalBarriersAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'

const TechnicalBarrierDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isUniversity, isEnterprise } = useUserStore()
  const [barrier, setBarrier] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showInquiryForm, setShowInquiryForm] = useState(false)
  const [inquiryMessage, setInquiryMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBarrier()
  }, [id])

  const fetchBarrier = async () => {
    try {
      setLoading(true)
      const response = await technicalBarriersAPI.getBarrier(id)
      setBarrier(response.data)
    } catch (error) {
      console.error('获取技术壁垒详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个技术壁垒吗？')) return
    try {
      await technicalBarriersAPI.deleteBarrier(id)
      navigate('/technical-barriers')
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleSubmitInquiry = async (e) => {
    e.preventDefault()
    if (!inquiryMessage.trim()) {
      alert('请输入咨询内容')
      return
    }
    setSubmitting(true)
    try {
      navigate('/chat?user_id=' + barrier.enterprise_id + '&context=barrier:' + barrier.id)
    } catch (error) {
      console.error('发起咨询失败:', error)
      alert('发起咨询失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      open: 'bg-green-100 text-green-800',
      solved: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-600'
    }
    const labels = {
      open: '开放中',
      solved: '已解决',
      cancelled: '已取消'
    }
    return (
      <span className={'px-3 py-1 rounded-full text-sm font-medium ' + (colors[status] || colors.open)}>
        {labels[status] || '开放中'}
      </span>
    )
  }

  const getDifficultyBadge = (difficulty) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      very_high: 'bg-red-100 text-red-800'
    }
    const labels = {
      low: '低难度',
      medium: '中难度',
      high: '高难度',
      very_high: '极高'
    }
    return (
      <span className={'px-3 py-1 rounded-full text-sm font-medium ' + (colors[difficulty] || colors.medium)}>
        {labels[difficulty] || '中难度'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!barrier) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">
          技术壁垒不存在
        </div>
      </div>
    )
  }

  const isOwner = user && barrier.enterprise_id === user.id

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/technical-barriers"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{barrier.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(barrier.status)}
            {getDifficultyBadge(barrier.difficulty)}
            <span className="text-sm text-gray-500">
              发布于 {new Date(barrier.created_at).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Link
              to={'/technical-barriers/edit/' + barrier.id}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              编辑
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              删除
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {barrier.enterprise_name ? barrier.enterprise_name.charAt(0) : '企'}
          </div>
          <div>
            <div className="font-medium text-gray-900">{barrier.enterprise_name || '企业'}</div>
            <div className="text-sm text-gray-600">壁垒发布方</div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 mb-6 text-sm text-gray-600">
        <div>
          <span className="font-medium text-gray-900">{barrier.view_count || 0}</span> 次浏览
        </div>
        <div>
          <span className="font-medium text-gray-900">{barrier.inquiry_count || 0}</span> 次咨询
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">壁垒描述</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{barrier.description}</p>
      </div>

      {barrier.technical_area && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">技术领域</h2>
          <span className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm">
            {barrier.technical_area}
          </span>
        </div>
      )}

      {barrier.challenge && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">技术挑战</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{barrier.challenge}</p>
        </div>
      )}

      {barrier.impact && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">业务影响</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{barrier.impact}</p>
        </div>
      )}

      {barrier.current_solution && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">当前解决方案</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{barrier.current_solution}</p>
        </div>
      )}

      {barrier.desired_solution && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">期望解决方案</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{barrier.desired_solution}</p>
        </div>
      )}

      {(barrier.investment || barrier.timeline || barrier.category) && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">项目信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {barrier.investment && (
              <div>
                <div className="text-sm text-gray-500 mb-1">已投入资金</div>
                <div className="text-lg font-semibold text-gray-900">
                  {'¥' + (barrier.investment / 10000).toFixed(2) + ' 万'}
                </div>
              </div>
            )}
            {barrier.timeline && (
              <div>
                <div className="text-sm text-gray-500 mb-1">预期解决时间</div>
                <div className="text-lg font-semibold text-gray-900">{barrier.timeline}</div>
              </div>
            )}
            {barrier.category && (
              <div>
                <div className="text-sm text-gray-500 mb-1">分类</div>
                <div className="text-lg font-semibold text-gray-900">{barrier.category}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {barrier.tags && barrier.tags.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">标签</h2>
          <div className="flex flex-wrap gap-2">
            {barrier.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && isUniversity() && barrier.status === 'open' && !showInquiryForm && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">可以解决此技术壁垒？</h3>
          <p className="text-gray-600 mb-4">如果您认为可以帮助解决此技术壁垒，可以与企业进行交流洽谈。</p>
          <button
            onClick={() => setShowInquiryForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            发起交流
          </button>
        </div>
      )}

      {showInquiryForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">发起咨询</h3>
          <form onSubmit={handleSubmitInquiry}>
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="请描述您对该技术壁垒的理解和解决方案..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={5}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交并开始聊天'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInquiryForm(false)
                  setInquiryMessage('')
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default TechnicalBarrierDetail
