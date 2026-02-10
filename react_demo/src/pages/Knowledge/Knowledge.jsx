import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { knowledgeAPI } from '../../services/api'
import { formatDate } from '../../utils/helpers'

const Knowledge = () => {
  const [knowledge, setKnowledge] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  useEffect(() => {
    // 打印用户信息调试
    const storage = localStorage.getItem('user-storage')
    if (storage) {
      try {
        const parsed = JSON.parse(storage)
        const user = parsed?.state?.user
        console.log('[Knowledge] 当前用户信息:', user)
        console.log('[Knowledge] user.role:', user?.role)
        console.log('[Knowledge] user.role.lower():', user?.role?.toLowerCase())
      } catch (e) {
        console.error('[Knowledge] 解析storage失败:', e)
      }
    }
    fetchCategories()
    fetchStats()
  }, [])

  useEffect(() => {
    fetchKnowledge()
  }, [page, filterCategory])

  const fetchKnowledge = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        page_size: pageSize,
        search: searchTerm || undefined,
        category: filterCategory || undefined
      }
      const response = await knowledgeAPI.getKnowledge(params)
      setKnowledge(response.data.items || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error('Failed to fetch knowledge:', error)
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Auth error - will be handled by route protection
        return
      }
      setKnowledge([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await knowledgeAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Silently fail for stats - not critical
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await knowledgeAPI.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Use default categories on error
      setCategories(['平台功能', '注册登录', '岗位招聘', '资源中心', '其他'])
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchKnowledge()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个知识条目吗？')) return

    try {
      await knowledgeAPI.deleteKnowledge(id)
      fetchKnowledge()
      fetchStats()
    } catch (error) {
      console.error('Failed to delete knowledge:', error)
      alert('删除失败，请重试')
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-blue-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">知识库管理</h1>
          <p className="text-gray-600 mt-1">管理在线客服的知识库内容</p>
        </div>
        <Link
          to="/knowledge/create"
          className="px-6 py-2 bg-blue-900 text-white font-medium hover:bg-blue-800 border-2 border-blue-900"
        >
          添加知识
        </Link>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-gray-300 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-900 flex items-center justify-center rounded-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">总记录数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_records}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-300 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-900 flex items-center justify-center rounded-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">知识条目</p>
                <p className="text-2xl font-bold text-gray-900">{stats.learned_count}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Hit Questions */}
      {stats && stats.top_hit_questions && stats.top_hit_questions.length > 0 && (
        <div className="bg-white border-2 border-gray-300 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">热门问题</h3>
          <div className="space-y-3">
            {stats.top_hit_questions.map((q, index) => (
              <div key={q.id} className="flex items-center justify-between p-3 border border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <span className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-blue-900 text-white' :
                    index === 1 ? 'bg-blue-800 text-white' :
                    index === 2 ? 'bg-blue-700 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="ml-3 text-gray-800">{q.question}</span>
                </div>
                <span className="text-sm text-gray-600">{q.hit_count} 次命中</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white border-2 border-gray-300 p-6 mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索问题、答案或关键词..."
              className="w-full px-4 py-2 border-2 border-gray-300 focus:outline-none focus:border-blue-900 bg-white"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2 border-2 border-gray-300 focus:outline-none focus:border-blue-900 bg-white"
          >
            <option value="">全部分类</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-900 text-white font-medium hover:bg-blue-800 border-2 border-blue-900"
          >
            搜索
          </button>
        </form>
      </div>

      {/* Knowledge Table */}
      <div className="bg-white border-2 border-gray-300 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-gray-600">加载中...</div>
          </div>
        ) : knowledge.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">暂无知识库内容</p>
            <Link
              to="/knowledge/create"
              className="inline-block px-6 py-2 bg-blue-900 text-white font-medium hover:bg-blue-800 border-2 border-blue-900"
            >
              添加第一条知识
            </Link>
          </div>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead className="bg-blue-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium border-r border-blue-800">
                    问题
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium border-r border-blue-800">
                    答案摘要
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium border-r border-blue-800">
                    分类
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium border-r border-blue-800">
                    命中次数
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium border-r border-blue-800">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {knowledge.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 border-r border-gray-200">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.question}>
                        {item.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200">
                      <div className="text-sm text-gray-600 max-w-xs truncate" title={item.answer}>
                        {item.answer.length > 50 ? item.answer.slice(0, 50) + '...' : item.answer}
                      </div>
                    </td>
                    <td className="px-6 py-4 border-r border-gray-200">
                      <span className={`px-2 py-1 text-xs ${
                        item.category ? 'bg-blue-100 text-blue-900 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}>
                        {item.category || '未分类'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-200">
                      {item.hit_count}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 border-r border-gray-200">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <Link
                        to={`/knowledge/edit/${item.id}`}
                        className="text-blue-900 hover:text-blue-700 underline mr-4"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-700 hover:text-red-900 underline"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t-2 border-gray-300 flex items-center justify-between bg-gray-50">
                <div className="text-sm text-gray-600">
                  共 {total} 条记录，第 {page} / {totalPages} 页
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-1 border-2 border-gray-400 text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-1 border-2 border-gray-400 text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Knowledge
