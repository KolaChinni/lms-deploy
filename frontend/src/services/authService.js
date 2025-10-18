import api from './api'

export const authService = {
  async register(userData) {
    try {
      console.log('🔵 authService: Sending registration request...', userData)
      const response = await api.post('/auth/register', userData)
      console.log('🟢 authService: Registration success:', response.data)
      return response.data
    } catch (error) {
      console.log('🔴 authService: Raw error object:', error)
      console.log('🔴 authService: Error response exists?', !!error.response)
      console.log('🔴 authService: Error response data:', error.response?.data)
      
      // If error is already structured from api.js, throw it as-is
      if (error && error.type) {
        console.log('🟡 authService: Already structured error type:', error.type)
        throw error
      }
      
      const errorData = error.response?.data
      console.log('🟡 authService: Processing error data:', errorData)
      
      // Handle backend error format - FIXED VERSION
      if (errorData && errorData.success === false) {
        console.log('🟡 authService: Backend error detected')
        
        // Check if errorData has errorData property (nested structure)
        if (errorData.errorData && errorData.errorData.type) {
          const errorType = errorData.errorData.type
          console.log('🟡 authService: Backend error type:', errorType)
          
          if (errorType === 'USER_EXISTS') {
            console.log('🟡 authService: Throwing USER_EXISTS error')
            throw {
              type: 'USER_EXISTS',
              message: errorData.errorData.message,
              suggestion: errorData.errorData.suggestion,
              existingRole: errorData.errorData.existingRole
            }
          } else if (errorType === 'VALIDATION_ERROR') {
            throw {
              type: 'VALIDATION_ERROR',
              message: errorData.errorData.message,
              errors: errorData.errorData.errors
            }
          }
        }
        
        // If no nested errorData, use the main message
        console.log('🟡 authService: Using main error message')
        throw {
          type: 'REGISTRATION_ERROR',
          message: errorData.message || 'Registration failed',
          suggestion: 'Please check your information and try again.'
        }
      }
      
      // Handle network errors (no response at all)
      if (!error.response) {
        console.log('🔴 authService: No response - real network error')
        throw {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server.',
          suggestion: 'Please check your internet connection and try again.'
        }
      }
      
      // Fallback error for any other case
      console.log('🔴 authService: Fallback error - unknown response format')
      throw {
        type: 'UNKNOWN_ERROR',
        message: 'Registration failed. Please try again.'
      }
    }
  },

  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      // If error is already structured from api.js, throw it as-is
      if (error && error.type) {
        throw error
      }
      
      const errorData = error.response?.data
      
      // Handle backend error format
      if (errorData?.success === false) {
        if (errorData.errorData && errorData.errorData.type) {
          const errorType = errorData.errorData.type
          
          if (errorType === 'NO_ACCOUNT') {
            throw {
              type: 'NO_ACCOUNT',
              message: errorData.errorData.message,
              suggestion: errorData.errorData.suggestion
            }
          } else if (errorType === 'INVALID_PASSWORD') {
            throw {
              type: 'INVALID_PASSWORD',
              message: errorData.errorData.message,
              suggestion: errorData.errorData.suggestion
            }
          } else if (errorType === 'ROLE_MISMATCH') {
            throw {
              type: 'ROLE_MISMATCH',
              message: errorData.errorData.message,
              suggestion: errorData.errorData.suggestion,
              actualRole: errorData.errorData.actualRole,
              requestedRole: errorData.errorData.requestedRole
            }
          } else if (errorType === 'VALIDATION_ERROR') {
            throw {
              type: 'VALIDATION_ERROR',
              message: errorData.errorData.message,
              errors: errorData.errorData.errors
            }
          }
        }
        
        // Fallback to main message
        throw {
          type: 'LOGIN_ERROR',
          message: errorData.message || 'Login failed',
          suggestion: 'Please check your credentials and try again.'
        }
      }
      
      // Handle network errors
      if (!error.response) {
        throw {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server.',
          suggestion: 'Please check your internet connection and try again.'
        }
      }
      
      // Fallback error
      throw {
        type: 'UNKNOWN_ERROR',
        message: 'Login failed. Please try again.'
      }
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/me')
      return response.data.user
    } catch (error) {
      if (error && error.type) {
        throw error
      }
      
      if (!error.response) {
        throw {
          type: 'NETWORK_ERROR',
          message: 'Unable to connect to the server.'
        }
      }
      
      throw {
        type: 'PROFILE_ERROR',
        message: 'Failed to get profile'
      }
    }
  },

  async verifyEmail() {
    try {
      const response = await api.post('/auth/verify-email')
      return response.data
    } catch (error) {
      if (error && error.type) {
        throw error
      }
      
      throw {
        type: 'VERIFICATION_ERROR',
        message: 'Email verification failed'
      }
    }
  },

  async healthCheck() {
    try {
      const response = await api.get('/auth/health')
      return response.data
    } catch (error) {
      if (error && error.type) {
        throw error
      }
      
      throw {
        type: 'HEALTH_CHECK_FAILED',
        message: 'Server health check failed'
      }
    }
  },

  async logout() {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('loginTime')
      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('loginTime')
      return { success: true, message: 'Logged out successfully' }
    }
  },

  isAuthenticated() {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      return false
    }
    
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]))
      const isExpired = tokenData.exp * 1000 < Date.now()
      return !isExpired
    } catch (error) {
      return false
    }
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (error) {
      return null
    }
  },

  updateUser(updatedUser) {
    try {
      const currentUser = this.getCurrentUser()
      const mergedUser = { ...currentUser, ...updatedUser }
      localStorage.setItem('user', JSON.stringify(mergedUser))
      return mergedUser
    } catch (error) {
      return null
    }
  },

  getToken() {
    return localStorage.getItem('token')
  },

  shouldReauthenticate() {
    const loginTime = localStorage.getItem('loginTime')
    if (!loginTime) return true

    const loginDate = new Date(loginTime)
    const now = new Date()
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60)
    return hoursDiff > 12
  }
}

export default authService
