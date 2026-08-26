import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();
const API_BASE_URL = 'http://localhost:8000';

export const AuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem('access_token') || localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const [user, setUser] = useState(() => {
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(storedUser && storedToken));
  const [token, setToken] = useState(storedToken || null);
  const [authReady, setAuthReady] = useState(true);

  const resolveRole = (role, isSuperuser) => {
    if (role && role.trim()) return role;
    if (isSuperuser) return 'super_admin';
    return 'talent_admin';
  };

  const login = async (username, password) => {
    try {
      console.log('Attempting login with username:', username);
      
      const tokenResponse = await fetch(`${API_BASE_URL}/api/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      console.log('Token response status:', tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        const errorMsg = errorData.detail || errorData.non_field_errors?.[0] || 'Invalid username or password';
        throw new Error(errorMsg);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access;
      const refreshToken = tokenData.refresh;
      console.log('Token received successfully');

      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      localStorage.setItem('token', accessToken);

      const profileResponse = await fetch(`${API_BASE_URL}/api/users/current/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Profile response status:', profileResponse.status);

      let userProfile = {
        username,
        role: 'talent_admin',
        email: '',
        is_superuser: false,
      };

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        console.log('Profile data received:', profile);
        userProfile = {
          ...userProfile,
          ...profile,
          role: resolveRole(profile.role, profile.is_superuser),
        };
      } else {
        console.warn('Profile fetch failed with status:', profileResponse.status);
      }

      const userData = {
        ...userProfile,
        token: accessToken,
        role: resolveRole(userProfile.role, userProfile.is_superuser),
      };

      setUser(userData);
      setToken(accessToken);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', accessToken);
      console.log('Login successful for user:', username);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const checkAuth = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('access_token') || localStorage.getItem('token');
    try {
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      setUser(parsedUser);
      setToken(storedToken);
      setIsAuthenticated(Boolean(parsedUser && storedToken));
    } catch {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
    setAuthReady(true);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, authReady, token, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
