import axios from 'axios'

// API Base URL - configured once for the entire application
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds
})

// Request interceptor — attach session token on every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('erp_session')
        if (raw) {
          const session = JSON.parse(raw)
          if (session?.sessionToken) {
            config.headers['X-Session-Token'] = session.sessionToken
          }
        }
      } catch { /* ignore */ }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor — redirect to login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('erp_session')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API Response type
export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}
