// Simple password hashing using Web Crypto API
// For production, use bcrypt on the server side

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'chique_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const newHash = await hashPassword(password);
  return newHash === hash;
};

// Session management
const SESSION_KEY = 'chique_session';

export interface Session {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  loginTime: string;
}

export const saveSession = (session: Session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const getSession = (): Session | null => {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
