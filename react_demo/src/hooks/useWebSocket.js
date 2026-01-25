import { useEffect, useCallback } from 'react'
import wsService from '../services/websocket'
import useUserStore from '../stores/userStore'
import useChatStore from '../stores/chatStore'

const useWebSocket = () => {
  const { token } = useUserStore()
  const { addMessage, updateOnlineStatus } = useChatStore()

  useEffect(() => {
    if (token) {
      wsService.connect(token)

      const handleNewMessage = (message) => {
        addMessage(message)
      }

      const handleOnlineStatus = ({ userId, isOnline }) => {
        updateOnlineStatus(userId, isOnline)
      }

      wsService.on('new_message', handleNewMessage)
      wsService.on('online_status', handleOnlineStatus)

      return () => {
        wsService.off('new_message', handleNewMessage)
        wsService.off('online_status', handleOnlineStatus)
      }
    }
  }, [token, addMessage, updateOnlineStatus])

  const sendMessage = useCallback((conversationId, content) => {
    wsService.send('message', { conversationId, content })
  }, [])

  const sendTyping = useCallback((conversationId) => {
    wsService.send('typing', { conversationId })
  }, [])

  return {
    sendMessage,
    sendTyping,
    isConnected: wsService.ws?.readyState === WebSocket.OPEN
  }
}

export default useWebSocket
