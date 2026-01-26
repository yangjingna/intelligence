import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { chatAPI } from '../../services/api'
import useUserStore from '../../stores/userStore'
import useChatStore from '../../stores/chatStore'
import wsService from '../../services/websocket'
import { formatTime } from '../../utils/helpers'
import { MESSAGE_TYPES } from '../../utils/constants'
import SummaryPanel from '../../components/SummaryPanel'

const MessageBubble = ({ message, isOwn }) => {
  const isAI = message.type === MESSAGE_TYPES.AI_RESPONSE

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwn
            ? 'bg-blue-600 text-white'
            : isAI
            ? 'bg-purple-100 text-purple-900 border border-purple-200'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {isAI && (
          <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
            <span>🤖</span>
            <span>智能体回答</span>
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isOwn ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  )
}

const ConversationItem = ({ conversation, isActive, onClick, onlineUsers }) => {
  const isOnline = onlineUsers.has(conversation.targetUserId)

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
        isActive ? 'bg-blue-50' : ''
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-medium">
            {conversation.targetUserName?.charAt(0) || 'U'}
          </span>
        </div>
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <div className="flex-1 text-left">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-900">
            {conversation.targetUserName || '用户'}
          </h4>
          <span className="text-xs text-gray-400">
            {conversation.lastMessageTime && formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {conversation.lastMessage || '暂无消息'}
        </p>
        {conversation.jobTitle && (
          <p className="text-xs text-blue-500 mt-1">
            岗位：{conversation.jobTitle}
          </p>
        )}
      </div>
      {conversation.unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  )
}

const Chat = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, token, isAuthenticated } = useUserStore()
  const {
    conversations,
    currentConversation,
    messages,
    onlineUsers,
    setConversations,
    setCurrentConversation,
    setMessages,
    addMessage,
    updateOnlineStatus
  } = useChatStore()

  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const messagesEndRef = useRef(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations()
      setupWebSocket()
    }

    return () => {
      wsService.off('new_message', handleNewMessage)
      wsService.off('online_status', handleOnlineStatus)
    }
  }, [isAuthenticated])

  useEffect(() => {
    const jobId = searchParams.get('jobId')
    const hrId = searchParams.get('hrId')
    if (jobId && hrId) {
      initConversationFromJob(jobId, hrId)
    }
  }, [searchParams])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const setupWebSocket = () => {
    if (token) {
      wsService.connect(token)
      wsService.on('new_message', handleNewMessage)
      wsService.on('online_status', handleOnlineStatus)
    }
  }

  const handleNewMessage = (message) => {
    if (message.conversationId === currentConversation?.id) {
      addMessage(message)
    }
    // Update conversation list
    fetchConversations()
  }

  const handleOnlineStatus = ({ userId, isOnline }) => {
    updateOnlineStatus(userId, isOnline)
  }

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations()
      setConversations(response.data || [])
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
      // Mock data
      setConversations([
        {
          id: 1,
          targetUserId: 101,
          targetUserName: '张经理',
          lastMessage: '您好，请问您对这个岗位感兴趣吗？',
          lastMessageTime: new Date().toISOString(),
          jobTitle: '前端开发工程师',
          unreadCount: 2
        },
        {
          id: 2,
          targetUserId: 102,
          targetUserName: '李经理',
          lastMessage: '感谢您的关注',
          lastMessageTime: new Date().toISOString(),
          jobTitle: '后端开发工程师',
          unreadCount: 0
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const initConversationFromJob = async (jobId, hrId) => {
    try {
      const response = await chatAPI.getOrCreateConversation(hrId, jobId)
      setCurrentConversation(response.data)
      fetchMessages(response.data.id)
    } catch (error) {
      console.error('Failed to init conversation:', error)
    }
  }

  const fetchMessages = async (conversationId) => {
    try {
      const response = await chatAPI.getMessages(conversationId)
      setMessages(response.data || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      // Mock messages
      setMessages([
        {
          id: 1,
          content: '您好，我对贵公司的岗位很感兴趣',
          senderId: user?.id,
          type: MESSAGE_TYPES.TEXT,
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          content: '感谢您的关注！请问您有相关工作经验吗？',
          senderId: 101,
          type: MESSAGE_TYPES.TEXT,
          createdAt: new Date(Date.now() - 3000000).toISOString()
        },
        {
          id: 3,
          content: '您好，HR 当前离线。根据您的问题，我来为您解答：这个岗位主要负责前端产品开发，需要熟悉 React 或 Vue 框架。如需更多信息，HR 上线后会尽快回复您。',
          senderId: 101,
          type: MESSAGE_TYPES.AI_RESPONSE,
          createdAt: new Date(Date.now() - 1800000).toISOString()
        }
      ])
    }
  }

  const selectConversation = (conversation) => {
    setCurrentConversation(conversation)
    fetchMessages(conversation.id)
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || !currentConversation) return

    setSending(true)
    const messageContent = inputValue.trim()
    setInputValue('')

    // Optimistic update
    const tempMessage = {
      id: Date.now(),
      content: messageContent,
      senderId: user?.id,
      type: MESSAGE_TYPES.TEXT,
      createdAt: new Date().toISOString()
    }
    addMessage(tempMessage)

    try {
      // Send via WebSocket for real-time
      wsService.send('message', {
        conversationId: currentConversation.id,
        content: messageContent
      })

      // Also send via HTTP as backup
      await chatAPI.sendMessage(currentConversation.id, { content: messageContent })
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
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

  const isOnline = currentConversation
    ? onlineUsers.has(currentConversation.targetUserId)
    : false

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">消息</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无会话
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={currentConversation?.id === conv.id}
                onClick={() => selectConversation(conv)}
                onlineUsers={onlineUsers}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {currentConversation.targetUserName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {currentConversation.targetUserName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isOnline ? '在线' : '离线 - 智能体将自动回复'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentConversation.jobTitle && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">
                    {currentConversation.jobTitle}
                  </span>
                )}
                <button
                  onClick={() => setShowSummary(true)}
                  className="px-3 py-1 bg-purple-100 text-purple-600 text-sm rounded-full hover:bg-purple-200 transition-colors flex items-center gap-1"
                  title="AI 智能总结"
                >
                  <span>AI</span>
                  <span>智能总结</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user?.id}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-4">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息..."
                  rows={1}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || sending}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <p>选择一个会话开始聊天</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Panel Modal */}
      {showSummary && currentConversation && (
        <SummaryPanel
          conversationId={currentConversation.id}
          onClose={() => setShowSummary(false)}
        />
      )}
    </div>
  )
}

export default Chat
