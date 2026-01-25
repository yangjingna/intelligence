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

const CustomerService = () => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const quickQuestions = [
    '如何注册账号？',
    '如何发布岗位？',
    '如何联系HR？',
    '如何发布产学研资源？',
    '平台有哪些功能？'
  ]

  useEffect(() => {
    initChat()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initChat = async () => {
    try {
      const response = await customerServiceAPI.getHistory()
      if (response.data?.length > 0) {
        setMessages(response.data)
      } else {
        // Welcome message
        setMessages([
          {
            id: 1,
            content: '您好！我是智能客服助手，很高兴为您服务。您可以问我关于平台使用的任何问题，例如：\n\n• 如何注册和登录\n• 如何发布和管理岗位\n• 如何与HR沟通\n• 如何发布产学研资源\n\n请问有什么可以帮助您的？',
            isUser: false,
            createdAt: new Date().toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
      setMessages([
        {
          id: 1,
          content: '您好！我是智能客服助手，很高兴为您服务。请问有什么可以帮助您的？',
          isUser: false,
          createdAt: new Date().toISOString()
        }
      ])
    } finally {
      setInitialLoading(false)
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">智能客服</h1>
              <p className="text-purple-200 text-sm">24小时在线，随时为您解答</p>
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
    </div>
  )
}

export default CustomerService
