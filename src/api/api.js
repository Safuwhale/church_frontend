/**
 * API Service Module
 * Handles secure communication between the React frontend and FastAPI backend.
 * Features automatic token refresh and centralized error handling.
 */

import { clearAuthState, getAuthState, setAuthState } from '../store/authStore';
const API_BASE = import.meta.env.VITE_API_BASE_URL ;
/**
 * Secure fetch wrapper.
 * Automatically injects the Bearer token and attempts token refresh on 401 errors.
 * @param {string} url - The endpoint path (e.g., '/api/users/me')
 * @param {Object} options - Standard fetch options
 */
export const secureFetch = async (url, options = {}) => {
  const { accessToken } = getAuthState();
  let token = accessToken;

  // 2. Prepare headers with Authorization
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  options.credentials = 'include';

  // 3. Execute the initial request
  let response = await fetch(`${API_BASE}${url}`, options);

  // 4. Handle token expiration (HTTP 401 Unauthorized)
  if (response.status === 401) {
    try {
      // Attempt to obtain a new access token using the refresh_token cookie
      const refreshRes = await fetch(`${API_BASE}/api/users/refresh`, { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        
        // Update the token in storage
        setAuthState({ accessToken: data.access_token, hydrated: true });
        
        // Retry the original request with the newly acquired token
        options.headers.Authorization = `Bearer ${data.access_token}`;
        response = await fetch(`${API_BASE}${url}`, options);
      } else {
        // If refresh fails (cookie expired/invalid), force logout
        console.warn("Session expired. Redirecting to login.");
        clearAuthState();
        window.location.href = '/login';
      }
    } catch (error) {
      console.error("Critical error during token refresh:", error);
      clearAuthState();
      window.location.href = '/login';
    }
  }

  return response;
};