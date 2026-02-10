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
  // 兼容后端返回的 snake_case 和前端 mock 数据的 camelCase
  const targetUserId = conversation.targetUserId || conversation.target_user_id
  const targetUserName = conversation.targetUserName || conversation.target_user_name
  const lastMessage = conversation.lastMessage || conversation.last_message
  const lastMessageTime = conversation.lastMessageTime || conversation.last_message_time
  const unreadCount = conversation.unreadCount ?? conversation.unread_count ?? 0
  const jobTitle = conversation.jobTitle || conversation.job_title
  const resourceTitle = conversation.resourceTitle || conversation.resource_title

  // 确保类型一致（都是数字）
  const normalizedTargetUserId = Number(targetUserId)
  const isOnline = Array.from(onlineUsers).some(id => Number(id) === normalizedTargetUserId)

  console.log('[ConversationItem] targetUserId:', targetUserId, 'type:', typeof targetUserId, 'onlineUsers:', Array.from(onlineUsers), 'isOnline:', isOnline)

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
            {targetUserName?.charAt(0) || 'U'}
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
            {targetUserName || '用户'}
          </h4>
          <span className="text-xs text-gray-400">
            {lastMessageTime && formatTime(lastMessageTime)}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate">
          {lastMessage || '暂无消息'}
        </p>
        {jobTitle && (
          <p className="text-xs text-blue-500 mt-1">
            岗位：{jobTitle}
          </p>
        )}
        {resourceTitle && (
          <p className="text-xs text-green-500 mt-1">
            资源：{resourceTitle}
          </p>
        )}
      </div>
      {unreadCount > 0 && (
        <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {unreadCount}
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
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [messageOffset, setMessageOffset] = useState(0)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const MESSAGE_LIMIT = 50

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
    const resourceId = searchParams.get('resourceId')
    const contactId = searchParams.get('contactId')

    if (jobId && hrId) {
      initConversation(hrId, jobId, null)
    } else if (resourceId && contactId) {
      initConversation(contactId, null, resourceId)
    }
  }, [searchParams])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const setupWebSocket = () => {
    if (token) {
      console.log('[Chat] 设置WebSocket监听器')
      wsService.connect(token)
      wsService.on('new_message', handleNewMessage)
      wsService.on('online_status', handleOnlineStatus)
    }
  }

  const handleNewMessage = (message) => {
    console.log('[Chat] handleNewMessage 收到:', message)
    const normalizedMessage = normalizeMessage(message)

    // 获取当前状态中的 currentConversation（避免闭包问题）
    const currentConvId = useChatStore.getState().currentConversation?.id
    console.log('[Chat] 当前会话ID:', currentConvId, '消息会话ID:', normalizedMessage.conversationId)

    if (normalizedMessage.conversationId === currentConvId) {
      console.log('[Chat] 添加消息到当前会话')
      addMessage(normalizedMessage)
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
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const initConversation = async (targetUserId, jobId = null, resourceId = null) => {
    try {
      const response = await chatAPI.getOrCreateConversation(targetUserId, jobId, resourceId)
      setCurrentConversation(response.data)
      fetchMessages(response.data.id)
    } catch (error) {
      console.error('Failed to init conversation:', error)
    }
  }

  const normalizeMessage = (msg) => ({
    ...msg,
    id: msg.id,
    conversationId: msg.conversationId || msg.conversation_id,
    senderId: msg.senderId || msg.sender_id,
    content: msg.content,
    type: msg.type,
    createdAt: msg.createdAt || msg.created_at
  })

  const fetchMessages = async (conversationId, isLoadMore = false) => {
    try {
      const offset = isLoadMore ? messageOffset : 0
      const response = await chatAPI.getMessages(conversationId, {
        skip: offset,
        limit: MESSAGE_LIMIT
      })

      const rawMessages = response.data || []
      const newMessages = rawMessages.map(normalizeMessage)

      if (isLoadMore) {
        // 加载更多时，将新消息添加到前面
        setMessages(prev => [...newMessages, ...prev])
      } else {
        setMessages(newMessages)
      }

      // 判断是否还有更多消息
      setHasMore(newMessages.length >= MESSAGE_LIMIT)
      setMessageOffset(offset + newMessages.length)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
      if (!isLoadMore) {
        setMessages([])
        setHasMore(false)
      }
    }
  }

  const loadMoreMessages = async () => {
    if (!currentConversation || loadingMore || !hasMore) return

    setLoadingMore(true)
    const scrollContainer = messagesContainerRef.current
    const previousScrollHeight = scrollContainer?.scrollHeight || 0

    await fetchMessages(currentConversation.id, true)

    // 保持滚动位置
    if (scrollContainer) {
      const newScrollHeight = scrollContainer.scrollHeight
      scrollContainer.scrollTop = newScrollHeight - previousScrollHeight
    }

    setLoadingMore(false)
  }

  const selectConversation = (conversation) => {
    setCurrentConversation(conversation)
    setMessageOffset(0)
    setHasMore(true)
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
      // Send via HTTP
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

  // 兼容后端返回的 snake_case 和前端 mock 数据的 camelCase
  const currentTargetUserId = currentConversation?.targetUserId || currentConversation?.target_user_id
  const currentTargetUserName = currentConversation?.targetUserName || currentConversation?.target_user_name
  const currentJobTitle = currentConversation?.jobTitle || currentConversation?.job_title
  const currentResourceTitle = currentConversation?.resourceTitle || currentConversation?.resource_title

  // 确保类型一致比较在线状态
  const isOnline = currentConversation
    ? Array.from(onlineUsers).some(id => Number(id) === Number(currentTargetUserId))
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
                      {currentTargetUserName?.charAt(0) || 'U'}
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
                    {currentTargetUserName || '联系人'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isOnline ? '在线' : '离线 - 智能体将自动回复'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentJobTitle && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full">
                    {currentJobTitle}
                  </span>
                )}
                {currentResourceTitle && (
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-sm rounded-full">
                    {currentResourceTitle}
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
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6">
              {/* 加载更多按钮 */}
              {hasMore && messages.length >= MESSAGE_LIMIT && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loadingMore}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                        加载中...
                      </span>
                    ) : (
                      '加载更多消息'
                    )}
                  </button>
                </div>
              )}

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
