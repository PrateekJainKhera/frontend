import axios from 'axios'

// API Base URL - configured once for the entire application
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api'

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor - can be used for auth tokens, logging, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - can be used for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Global error handling
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login, etc.
      console.error('Unauthorized access')
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
