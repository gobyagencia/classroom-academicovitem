// middleware/auth.ts
export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  
  // Inicializar auth si no está inicializada
  if (process.client) {
    auth.initializeAuth()
  }

  // Rutas que requieren autenticación
  const protectedRoutes = ['/', '/courses', '/profile']
  
  if (protectedRoutes.includes(to.path) && !auth.isAuthenticated) {
    return navigateTo('/auth/login')
  }

  // Si ya está autenticado, redirigir del login/register al home
  if ((to.path === '/auth/login' || to.path === '/auth/register') && auth.isAuthenticated) {
    return navigateTo('/')
  }
})