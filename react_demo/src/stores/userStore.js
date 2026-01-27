import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => set({ _hasHydrated: state }),

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
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[UserStore] Hydration error:', error)
        }
        // Always set hydrated to true after rehydration attempt
        useUserStore.setState({ _hasHydrated: true })
      }
    }
  )
)

// Also set hydrated immediately if storage is empty or on initial load
if (typeof window !== 'undefined') {
  // Ensure hydration flag is set after a short delay as fallback
  setTimeout(() => {
    if (!useUserStore.getState()._hasHydrated) {
      useUserStore.setState({ _hasHydrated: true })
    }
  }, 100)
}

export default useUserStore
