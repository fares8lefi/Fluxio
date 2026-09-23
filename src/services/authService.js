import { request } from './apiClient';

// --- Auth Endpoints ---

// Create a new user account
export const register = (payload) =>
  request('/api/users/createUser', payload, 'POST');

// Verify account using the code sent to email
export const verifyAccount = (email, code) =>
  request('/api/users/verifyAccounts', { email, code }, 'PUT');

// Resend the verification code
export const resendCode = (email) =>
  request('/api/users/resendCode', { email }, 'POST');

// Authenticate user and establish a session
export const login = (email, password) =>
  request('/api/users/loginUser', { email, password }, 'POST');

// Refresh access token (POST /api/users/refreshToken)
export const refreshToken = (token) =>
  request('/api/users/refreshToken', token ? { refreshToken: token } : undefined, 'POST');

// End user session and clear cookies
export const logout = () =>
  request('/api/users/logOutUser', undefined, 'POST');

// Fetch current authenticated user's session data
export const getMe = () =>
  request('/api/users/me', undefined, 'GET');
