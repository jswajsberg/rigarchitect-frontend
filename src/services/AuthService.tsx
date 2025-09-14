/**
 * Authentication service for JWT token management and API integration
 * @module AuthService
 */
import axios from "axios";

// JWT token structure
interface JWTTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}


// Storage keys for JWT tokens
const STORAGE_KEYS = {
  ACCESS_TOKEN: "rigarchitect_access_token",
  REFRESH_TOKEN: "rigarchitect_refresh_token",
  TOKEN_EXPIRY: "rigarchitect_token_expiry",
  USER_DATA: "rigarchitect_user_data",
} as const;

/**
 * AuthService - Centralized authentication utilities
 *
 * This service provides methods for JWT token management and will be
 * used when we integrate proper authentication with the backend.
 *
 * Current implementation uses localStorage for development,
 * but will be upgraded to use httpOnly cookies for production security.
 */
class AuthService {
  private static instance: AuthService;

  // Singleton pattern for consistent auth state
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // JWT Token Management (Future Implementation)

  /**
   * Store JWT tokens securely
   * Uses localStorage for development, production should use httpOnly cookies
   */
  setTokens(tokens: JWTTokens): void {
    // Uses localStorage for development
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      localStorage.setItem(
        STORAGE_KEYS.TOKEN_EXPIRY,
        tokens.expiresAt.toString()
      );
    }
  }

  /**
   * Retrieve stored access token
   */
  getAccessToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
    return null;
  }

  /**
   * Retrieve stored refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return null;
  }

  /**
   * Check if current token is expired
   */
  isTokenExpired(): boolean {
    if (typeof window !== "undefined") {
      const expiryStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (expiryStr) {
        const expiresAt = parseInt(expiryStr);
        return Date.now() >= expiresAt;
      }
    }
    return true;
  }

  /**
   * Clear all stored authentication data
   */
  clearAuth(): void {
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    }
  }

  // Axios Interceptors (Future Implementation)

  /**
   * Setup axios interceptors for automatic token attachment
   * Call this once during app initialization
   */
  setupAxiosInterceptors(): void {
    // Request interceptor - attach JWT token to requests
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token && !this.isTokenExpired()) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh for authenticated endpoints
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/api/v1/guest/') &&
            !originalRequest.url?.includes('/api/v1/auth/login') &&
            !originalRequest.url?.includes('/api/v1/auth/signup')) {
          
          originalRequest._retry = true;

          try {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
              // Retry original request with new token
              const newToken = this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return axios(originalRequest);
            } else {
              // Refresh failed - handle auth failure
              this.handleAuthFailure();
            }
          } catch (refreshError) {
            console.error("Token refresh error:", refreshError);
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          }
        }

        // For guest endpoints that return 404, don't treat as auth error
        if (error.response?.status === 404 && originalRequest.url?.includes('/api/v1/guest/')) {
          console.warn(`Guest endpoint not found: ${originalRequest.url}`);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.warn("No refresh token available");
        return false;
      }

      const response = await authAPI.refreshToken(refreshToken);
      
      this.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt
      });

      return true;
    } catch (error: any) {
      console.error("Token refresh failed:", error);
      
      // If refresh fails with 401, the refresh token is invalid
      if (error.response?.status === 401) {
        console.warn("Refresh token expired or invalid, clearing auth state");
        this.clearAuth();
      }
      
      return false;
    }
  }

  /**
   * Handle authentication failure - clear auth and redirect
   */
  private handleAuthFailure(): void {
    this.clearAuth();

    // Dispatch auth failure event for global handling
    window.dispatchEvent(new CustomEvent("auth:failure"));
  }

  // Development Utilities

  /**
   * Development helper - validate current auth state
   */
  validateCurrentAuth(): {
    isValid: boolean;
    hasTokens: boolean;
    isExpired: boolean;
    timeUntilExpiry?: number;
  } {
    const hasAccessToken = !!this.getAccessToken();
    const hasRefreshToken = !!this.getRefreshToken();
    const isExpired = this.isTokenExpired();

    let timeUntilExpiry: number | undefined;
    if (hasAccessToken && !isExpired) {
      const expiryStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      if (expiryStr) {
        timeUntilExpiry = parseInt(expiryStr) - Date.now();
      }
    }

    return {
      isValid: hasAccessToken && hasRefreshToken && !isExpired,
      hasTokens: hasAccessToken && hasRefreshToken,
      isExpired,
      timeUntilExpiry,
    };
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// JWT Authentication API calls
export const authAPI = {
  /**
   * Authenticate user with email/password
   */
  login: async (email: string, password: string) => {
    const response = await axios.post('/api/v1/auth/login', {
      email,
      password
    });
    return response.data;
  },

  /**
   * Register new user account
   */
  signup: async (userData: {
    name: string;
    email: string;
    password: string;
    budget?: number;
  }) => {
    const response = await axios.post('/api/v1/auth/signup', userData);
    return response.data;
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (refreshToken: string) => {
    const response = await axios.post('/api/v1/auth/refresh', {
      refreshToken
    });
    return response.data;
  },

  /**
   * Logout user and invalidate tokens
   */
  logout: async () => {
    try {
      await axios.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    authService.clearAuth();
  },

  /**
   * Verify current authentication status
   */
  verifyAuth: async () => {
    const response = await axios.get('/api/v1/auth/verify');
    return response.data;
  },

  /**
   * Change password for authenticated user
   */
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await axios.post('/api/v1/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },
};

export default authService;
