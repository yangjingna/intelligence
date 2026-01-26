import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { customerServiceAPI } from '../../services/api'
import { formatTime } from '../../utils/helpers'

// Markdown components styling
const markdownComponents = {
  h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-sm">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children, inline }) =>
    inline
      ? <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
      : <code className="block bg-gray-100 p-2 rounded text-sm font-mono my-2 overflow-x-auto">{children}</code>,
  pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded my-2 overflow-x-auto">{children}</pre>,
  a: ({ children, href }) => <a href={href} className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
  blockquote: ({ children }) => <blockquote className="border-l-4 border-purple-300 pl-3 my-2 italic">{children}</blockquote>,
}

const MessageBubble = ({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
          <span className="text-xl">🤖</span>
        </div>
      )}
      <div
        className={`max-w-md lg:max-w-xl px-4 py-3 rounded-lg ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <p
          className={`text-xs mt-2 ${
            isUser ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
      {isUser && (
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
          <span className="text-blue-600 font-medium">我</span>
        </div>
      )}
    </div>
  )
}

const QuickQuestionButton = ({ question, onClick }) => (
  <button
    onClick={() => onClick(question)}
    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors text-left"
  >
    {question}
  </button>
)

// 确认对话框组件
const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            确认清除
          </button>
        </div>
      </div>
    </div>
  )
}

const CustomerService = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [contextStatus, setContextStatus] = useState(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const messagesEndRef = useRef(null)

  const quickQuestions = [
    '如何注册账号？',
    '如何发布岗位？',
    '如何联系HR？',
    '如何发布产学研资源？',
    '平台有哪些功能？'
  ]

  const welcomeMessage = {
    id: 1,
    content: '您好！我是智能客服助手"小智"，很高兴为您服务。您可以问我关于平台使用的任何问题，例如：\n\n• 如何注册和登录\n• 如何发布和管理岗位\n• 如何与HR沟通\n• 如何发布产学研资源\n\n请问有什么可以帮助您的？',
    isUser: false,
    createdAt: new Date().toISOString()
  }

  useEffect(() => {
    initChat()
    loadContextStatus()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadContextStatus = async () => {
    try {
      const response = await customerServiceAPI.getContextStatus()
      setContextStatus(response.data)
    } catch (error) {
      // 如果未登录或出错，忽略上下文状态
      console.log('Context status not available')
    }
  }

  const initChat = async () => {
    try {
      const response = await customerServiceAPI.getHistory()
      if (response.data?.length > 0) {
        setMessages(response.data)
      } else {
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
      setMessages([welcomeMessage])
    } finally {
      setInitialLoading(false)
    }
  }

  const clearHistory = async () => {
    setClearing(true)
    try {
      await customerServiceAPI.clearHistory()
      setMessages([welcomeMessage])
      setContextStatus(null)
      setShowClearConfirm(false)
    } catch (error) {
      console.error('Failed to clear history:', error)
      alert('清除失败，请稍后重试')
    } finally {
      setClearing(false)
    }
  }

  const sendMessage = async (content = inputValue) => {
    if (!content.trim() || loading) return

    const userMessage = {
      id: Date.now(),
      content: content.trim(),
      isUser: true,
      createdAt: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const response = await customerServiceAPI.sendMessage(content.trim())
      const aiMessage = {
        id: Date.now() + 1,
        content: response.data?.reply || '抱歉，我暂时无法回答这个问题。请稍后再试或联系人工客服。',
        isUser: false,
        createdAt: new Date().toISOString()
      }
      setMessages(prev => [...prev, aiMessage])

      // 更新上下文状态
      loadContextStatus()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Mock AI response for development
      const mockResponses = {
        '如何注册账号？': '注册账号非常简单：\n\n1. 点击页面右上角的"注册"按钮\n2. 选择您的用户类型（学生或企业）\n3. 填写基本信息（姓名、邮箱、手机号等）\n4. 设置密码并确认\n5. 点击"注册"完成\n\n注册成功后，您可以使用邮箱和密码登录平台。',
        '如何发布岗位？': '发布岗位的步骤：\n\n1. 使用企业账号登录平台\n2. 进入"岗位管理"页面\n3. 点击"发布岗位"按钮\n4. 填写岗位信息（名称、薪资、地点、描述等）\n5. 点击"发布"完成\n\n发布后，学生用户即可在岗位列表中看到您的招聘信息。',
        '如何联系HR？': '联系HR的方式：\n\n1. 在岗位列表中找到感兴趣的岗位\n2. 点击"立即沟通"按钮\n3. 进入聊天界面与HR对话\n\n如果HR在线，您可以实时交流；如果HR离线，智能助手会自动回复基本问题，HR上线后会收到您的消息。',
        '如何发布产学研资源？': '发布产学研资源：\n\n1. 使用企业账号登录\n2. 进入"资源中心"页面\n3. 点击"发布资源"按钮\n4. 选择资源类型（项目合作、实习机会、科研项目等）\n5. 填写资源详情和联系方式\n6. 点击"发布"完成',
        '平台有哪些功能？': '平台主要功能包括：\n\n1. **岗位招聘**：企业发布岗位，学生浏览并应聘\n2. **实时沟通**：学生与HR在线交流\n3. **智能助手**：HR离线时自动回复\n4. **资源中心**：发布和浏览产学研合作资源\n5. **智能客服**：24小时解答平台使用问题\n6. **个人中心**：管理个人信息和历史记录'
      }

      const aiResponse = mockResponses[content] || '感谢您的提问！这是一个很好的问题。关于这个问题，建议您查看平台的帮助文档或联系人工客服获取更详细的解答。\n\n您还可以尝试问我其他问题，比如如何注册、如何发布岗位等。'

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        content: aiResponse,
        isUser: false,
        createdAt: new Date().toISOString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">智能客服</h1>
                <p className="text-purple-200 text-sm">24小时在线，随时为您解答</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {/* 上下文状态指示器 */}
              {contextStatus && (
                <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white/90 text-xs">
                    记忆: {contextStatus.short_term_messages}条
                  </span>
                </div>
              )}

              {/* 清除历史按钮 */}
              <button
                onClick={() => setShowClearConfirm(true)}
                disabled={messages.length <= 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="清除对话历史"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">清除</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-6 bg-gray-50">
          {initialLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isUser={message.isUser}
                />
              ))}
              {loading && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🤖</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Quick Questions */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2">快捷问题：</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question) => (
              <QuickQuestionButton
                key={question}
                question={question}
                onClick={sendMessage}
              />
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-end gap-4">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入您的问题..."
              rows={1}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!inputValue.trim() || loading}
              className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </div>
      </div>

      {/* 清除确认对话框 */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onConfirm={clearHistory}
        onCancel={() => setShowClearConfirm(false)}
        title="清除对话历史"
        message="确定要清除所有对话历史吗？此操作不可恢复。"
      />

      {/* 清除中遮罩 */}
      {clearing && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span>正在清除...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomerService
