// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isAuthenticated = ref(false)

  const login = async () => {
    // Implementación básica por ahora
    isAuthenticated.value = true
  }

  const logout = () => {
    isAuthenticated.value = false
    user.value = null
  }

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    login,
    logout
  }
})
