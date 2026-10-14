import { request } from './apiClient';

const BASE = '/api/team';

/** Membres + invitations en attente (gérant) */
export const getTeam = () => request(BASE);

/** Invite un collaborateur — renvoie aussi le lien à partager */
export const inviteMember = (email, company_role) =>
  request(`${BASE}/invitations`, { email, company_role }, 'POST');

export const revokeInvitation = (id) => request(`${BASE}/invitations/${id}`, undefined, 'DELETE');

export const updateMemberRole = (id, company_role) =>
  request(`${BASE}/members/${id}`, { company_role }, 'PATCH');

export const removeMember = (id) => request(`${BASE}/members/${id}`, undefined, 'DELETE');

// ── Page d'acceptation (sans connexion) ─────────────────────────────────────

export const previewInvitation = (token) =>
  request(`${BASE}/invitations/preview?token=${encodeURIComponent(token)}`);

export const acceptInvitation = (payload) => request(`${BASE}/invitations/accept`, payload, 'POST');
