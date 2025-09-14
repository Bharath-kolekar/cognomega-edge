// frontend/src/lib/auth/headers.ts
export function buildAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const email = localStorage.getItem('user_email') || '';
  const jwt = localStorage.getItem('jwt') || '';

  if (email) h['X-User-Email'] = email;
  if (jwt)   h['Authorization'] = `Bearer ${jwt}`;
  return h;
}
