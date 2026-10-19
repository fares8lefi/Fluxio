import { createContext, useContext, useEffect, useState } from 'react';
import { getMe, login as apiLogin, logout as apiLogout } from '@/services/authService';
import { can as canDo } from '@/lib/permissions';

const AuthContext = createContext();

// Startup session check, shared so StrictMode's double effect run
// (dev only) sends a single GET /me instead of two
let sessionCheck = null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify session on application startup
    sessionCheck ??= getMe();
    sessionCheck
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    window.location.hash = '#login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        // can('stock.write') … : masque les actions non autorisées pour le rôle
        can: (action) => canDo(user, action),
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
