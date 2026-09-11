import { API_URL } from '@/constants/api';

// User-friendly HTTP error messages mapping
const HTTP_MESSAGES = {
  401: 'Email ou mot de passe incorrect.',
  403: 'Compte non vérifié. Vérifiez votre email.',
  409: 'Un compte avec cet email existe déjà.',
  400: 'Les informations saisies sont invalides.',
  404: 'Ressource introuvable.',
  500: 'Une erreur est survenue. Veuillez réessayer.',
};

// Core request helper for making API calls
async function request(path, body, method = 'POST') {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include', // Ensures cookies are sent with requests
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      'Impossible de contacter le serveur. Vérifiez votre connexion.'
    );
  }

  // Attempt to parse JSON; fails silently if response is not valid JSON
  let data = {};
  try {
    data = await response.json();
  } catch {
    // Empty body or unexpected HTML
  }

  // Handle HTTP errors and unsuccessful API responses
  if (!response.ok || !data.success) {
    const fallback =
      HTTP_MESSAGES[response.status] ?? 'Une erreur est survenue.';
    throw new Error(data.message || fallback);
  }

  return data;
}

// --- Auth Endpoints ---

// Create a new user account
export const register = (payload) => request('/api/users/createUser', payload);

// Verify account using the code sent to email
export const verifyAccount = (email, code) =>
  request('/api/users/verifyAccounts', { email, code }, 'PUT');

// Resend the verification code
export const resendCode = (email) =>
  request('/api/users/resendCode', { email });

// Authenticate user and establish a session
export const login = (email, password) =>
  request('/api/users//loginUser', { email, password });

// End user session and clear cookies
export const logout = () => request('/api/users/logout', undefined, 'POST');

// Fetch current authenticated user's session data
export const getMe = () =>
  request('/api/users/me', undefined, 'GET');
