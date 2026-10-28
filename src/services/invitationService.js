import { request } from './apiClient';

// --- Team invitations (public endpoints, no session required) ---

// Invitation details: { email, company_role, company_name }
export const previewInvitation = (token) =>
  request(`/api/team/invitations/preview?token=${encodeURIComponent(token)}`);

// Create the invited user's account: { token, username, password, phone? }
export const acceptInvitation = (payload) =>
  request('/api/team/invitations/accept', payload, 'POST');
