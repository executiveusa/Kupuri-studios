import { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AuthStatus, getAuthStatus } from '../api/auth'

interface AuthContextType {
  authStatus: AuthStatus
  isLoading: boolean
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // GUEST MODE: Default to logged in for immediate access
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    status: 'logged_in',
    is_logged_in: true,
    user: { email: 'guest@kupuri.studios', name: 'Guest User' }
  })
  const [isLoading, setIsLoading] = useState(false) // Skip loading state

  const refreshAuth = async () => {
    try {
      setIsLoading(true)
      const status = await getAuthStatus()

      // Check if token expired based on the status returned by getAuthStatus
      if (status.tokenExpired) {
        toast.error('登录状态已过期，请重新登录', {
          duration: 5000,
        })
      }

      setAuthStatus(status)
    } catch (error) {
      console.error('获取认证状态失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // GUEST MODE: Skip auth check in production
    if (import.meta.env.DEV) {
      refreshAuth()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ authStatus, isLoading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
