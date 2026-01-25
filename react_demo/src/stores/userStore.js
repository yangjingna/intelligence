import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (userData, token) => set({
        user: userData,
        token: token,
        isAuthenticated: true
      }),

      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),

      updateUser: (userData) => set({
        user: { ...get().user, ...userData }
      }),

      getRole: () => get().user?.role || null,

      isStudent: () => get().user?.role === 'student',

      isEnterprise: () => get().user?.role === 'enterprise'
    }),
    {
      name: 'user-storage'
    }
  )
)

export default useUserStore
