// Empty in production so requests stay same-origin and go through the Vercel /api proxy.
export const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000' : '');
