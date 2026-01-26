import { useState, useEffect } from 'react'
import { summaryAPI } from '../services/api'

const SummaryPanel = ({ conversationId, onClose }) => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (conversationId) {
      fetchSummary()
    }
  }, [conversationId])

  const fetchSummary = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await summaryAPI.getConversationSummary(conversationId)
      setSummary(response.data)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
      setError('获取总结失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-purple-600">AI</span>
            智能总结
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
              <p className="text-gray-500">AI 正在分析对话内容...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-4xl mb-4">!</div>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={fetchSummary}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                重试
              </button>
            </div>
          ) : summary ? (
            <div className="space-y-6">
              {/* Summary Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  对话总结
                </h3>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">{summary.summary}</p>
                </div>
              </div>

              {/* Key Points Section */}
              {summary.key_points && summary.key_points.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    关键要点
                  </h3>
                  <ul className="space-y-2">
                    {summary.key_points.map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User Interests Section */}
              {summary.user_interests && summary.user_interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    用户关注点
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {summary.user_interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Actions Section */}
              {summary.suggested_actions && summary.suggested_actions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    建议行动
                  </h3>
                  <ul className="space-y-2">
                    {summary.suggested_actions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 text-orange-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        <span className="text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            由 AI 智能分析生成，仅供参考
          </p>
        </div>
      </div>
    </div>
  )
}

export default SummaryPanel
