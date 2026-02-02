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

      isEnterprise: () => get().user?.role === 'enterprise',

      isUniversity: () => get().user?.role === 'university',

      isGovernment: () => get().user?.role === 'government'
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
      }
    }
  )
)

// Set hydrated flag after store is created
useUserStore.persist.onFinishHydration(() => {
  useUserStore.setState({ _hasHydrated: true })
})

// Fallback: set hydrated after a short delay if onFinishHydration doesn't fire
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (!useUserStore.getState()._hasHydrated) {
      useUserStore.setState({ _hasHydrated: true })
    }
  }, 100)
}

export default useUserStore
