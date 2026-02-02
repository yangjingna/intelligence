import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { inquiryRecordsAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import { INQUIRY_STATUS } from '../../utils/constants'

const InquiryDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useUserStore()
  const [inquiry, setInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [showStatusUpdate, setShowStatusUpdate] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInquiry()
  }, [id])

  const fetchInquiry = async () => {
    try {
      setLoading(true)
      const response = await inquiryRecordsAPI.getInquiry(id)
      setInquiry(response.data)
    } catch (error) {
      console.error('获取咨询记录详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个咨询记录吗？')) return

    try {
      await inquiryRecordsAPI.deleteInquiry(id)
      navigate('/inquiry-records')
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败，请重试')
    }
  }

  const handleSubmitReply = async (e) => {
    e.preventDefault()
    if (!replyContent.trim()) {
      alert('请输入回复内容')
      return
    }

    setSubmitting(true)
    try {
      await inquiryRecordsAPI.updateInquiry(id, {
        response: replyContent,
        status: 'responded'
      })
      await fetchInquiry()
      setShowReplyForm(false)
      setReplyContent('')
    } catch (error) {
      console.error('回复失败:', error)
      alert('回复失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('请选择新的状态')
      return
    }

    setSubmitting(true)
    try {
      await inquiryRecordsAPI.updateInquiry(id, { status: newStatus })
      await fetchInquiry()
      setShowStatusUpdate(false)
      setNewStatus('')
    } catch (error) {
      console.error('更新状态失败:', error)
      alert('更新状态失败，请重试')
    } finally {
      setSubmitting(false)
    }
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.pending}`}>
        {labels[status] || '待回复'}
      </span>
    )
  }

  const getTypeBadge = (type) => {
    const colors = {
      demand: 'bg-blue-100 text-blue-800',
      barrier: 'bg-purple-100 text-purple-800',
      achievement: 'bg-green-100 text-green-800'
    }
    const labels = {
      demand: '研发需求',
      barrier: '技术壁垒',
      achievement: '研发成果'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    )
  }

  const getRoleBadge = (role) => {
    const colors = {
      enterprise: 'bg-blue-50 text-blue-700',
      university: 'bg-green-50 text-green-700',
      government: 'bg-indigo-50 text-indigo-700'
    }
    const labels = {
      enterprise: '企业',
      university: '高校',
      government: '政府'
    }
    return (
      <span className={`inline-block px-2 py-1 rounded text-xs ${colors[role] || 'bg-gray-50 text-gray-700'}`}>
        {labels[role] || role}
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

  if (!inquiry) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 text-gray-500">
          咨询记录不存在
        </div>
      </div>
    )
  }

  const isOwner = user && inquiry.inquirer_id === user.id
  const isTarget = user && inquiry.target_user_id === user.id

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 返回按钮 */}
      <Link
        to="/inquiry-records"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回列表
      </Link>

      {/* 标题和操作按钮 */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{inquiry.subject}</h1>
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(inquiry.status)}
            {inquiry.inquiry_type && getTypeBadge(inquiry.inquiry_type)}
            <span className="text-sm text-gray-500">
              发布于 {new Date(inquiry.created_at).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isTarget && (
            <>
              {!showStatusUpdate && inquiry.status !== 'closed' && inquiry.status !== 'resolved' && (
                <button
                  onClick={() => setShowStatusUpdate(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  更新状态
                </button>
              )}
              {inquiry.status === 'pending' && !showReplyForm && (
                <button
                  onClick={() => setShowReplyForm(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  回复
                </button>
              )}
            </>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              删除
            </button>
          )}
        </div>
      </div>

      {/* 更新状态表单 */}
      {showStatusUpdate && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">更新咨询状态</h3>
          <div className="flex gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择新状态</option>
              <option value="responded">已回复</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {submitting ? '更新中...' : '确认'}
            </button>
            <button
              onClick={() => {
                setShowStatusUpdate(false)
                setNewStatus('')
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 咨询者信息 */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              {inquiry.inquirer_name?.charAt(0) || '?'}
            </div>
            <div>
              <div className="font-medium text-gray-900">{inquiry.inquirer_name || '咨询者'}</div>
              <div className="flex items-center gap-2">
                {inquiry.inquirer_role && getRoleBadge(inquiry.inquirer_role)}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">咨询发起方</div>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex gap-6 mb-6 text-sm text-gray-600">
        <div>
          <span className="font-medium text-gray-900">{inquiry.view_count || 0}</span> 次浏览
        </div>
        {inquiry.responded_at && (
          <div>
            回复于 {new Date(inquiry.responded_at).toLocaleString('zh-CN')}
          </div>
        )}
      </div>

      {/* 关联信息 */}
      {inquiry.related_demand_id && (
        <Link
          to={`/research-demands/${inquiry.related_demand_id}`}
          className="block bg-blue-50 rounded-lg p-4 mb-6 hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-blue-700">
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs">研发需求</span>
            <span className="text-sm">查看关联需求</span>
          </div>
        </Link>
      )}

      {inquiry.related_barrier_id && (
        <Link
          to={`/technical-barriers/${inquiry.related_barrier_id}`}
          className="block bg-purple-50 rounded-lg p-4 mb-6 hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-purple-700">
            <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs">技术壁垒</span>
            <span className="text-sm">查看关联壁垒</span>
          </div>
        </Link>
      )}

      {inquiry.related_achievement_id && (
        <Link
          to={`/research-achievements/${inquiry.related_achievement_id}`}
          className="block bg-green-50 rounded-lg p-4 mb-6 hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center gap-2 text-green-700">
            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs">研发成果</span>
            <span className="text-sm">查看关联成果</span>
          </div>
        </Link>
      )}

      {/* 咨询内容 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">咨询内容</h2>
        <p className="text-gray-700 whitespace-pre-wrap">{inquiry.content}</p>
      </div>

      {/* 回复内容 */}
      {inquiry.response && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">回复内容</h2>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{inquiry.response}</p>
          </div>
        </div>
      )}

      {/* 回复表单 */}
      {showReplyForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">回复咨询</h3>
          <form onSubmit={handleSubmitReply}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="请输入您的回复..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5}
            />
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '提交回复'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false)
                  setReplyContent('')
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 聊天按钮 */}
      {isAuthenticated() && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">进一步沟通</h3>
          <p className="text-gray-600 mb-4">通过实时聊天进行更深入的交流。</p>
          <Link
            to={`/chat?user_id=${isOwner ? inquiry.target_user_id : inquiry.inquirer_id}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            开始聊天
          </Link>
        </div>
      )}
    </div>
  )
}

export default InquiryDetail
