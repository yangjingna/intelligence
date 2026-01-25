import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  onlineUsers: new Set(),

  setConversations: (conversations) => set({ conversations }),

  setCurrentConversation: (conversation) => set({
    currentConversation: conversation,
    messages: []
  }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  setMessages: (messages) => set({ messages }),

  updateOnlineStatus: (userId, isOnline) => set((state) => {
    const newOnlineUsers = new Set(state.onlineUsers)
    if (isOnline) {
      newOnlineUsers.add(userId)
    } else {
      newOnlineUsers.delete(userId)
    }
    return { onlineUsers: newOnlineUsers }
  }),

  isUserOnline: (userId) => get().onlineUsers.has(userId),

  clearChat: () => set({
    currentConversation: null,
    messages: []
  })
}))

export default useChatStore
