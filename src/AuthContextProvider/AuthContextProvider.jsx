import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuthContext = () => {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const server_url = 'http://localhost:5172';
  const navigate = useNavigate();
  // Initialize user from localStorage so the logged-in user survives route changes / reloads
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('ps_user');
      return raw ? JSON.parse(raw) : undefined;
    } catch (err) {
      console.warn('Failed to parse ps_user from localStorage', err);
      return undefined;
    }
  });

  const [permissions, setPermissions] = useState([]);

  const fetchPermissions = async (username) => {
    try {
      const res = await axios.post(`${server_url}/users/permissions/get`, { username });
      setPermissions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchPermissions(user.username);
    }
  }, [user]);

  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem('ps_bg_color') || '#D4D4D4';
  });

  useEffect(() => {
    localStorage.setItem('ps_bg_color', bgColor);
  }, [bgColor]);


  const login = async (userData) => {

    try {
      const res = await axios.post(`${server_url}/login`, userData);
      if (res && res.data) {
        setUser(res.data);
        navigate('/dashboard'); // Redirect to dashboard after login
        localStorage.removeItem('ps_user');
        localStorage.setItem('ps_user', JSON.stringify(res.data));
      }
    } catch (error) {
      if (error?.response?.data?.error === "Invalid credentials") {
        window.alert("Username or Password Invalid !!!");
      } else {
        console.error("Login failed:", error);
        window.alert("Login failed. Please try again.");
      }
    }
  };

  const logout = async () => {
    if (user && user.username) {
      try {
        await axios.post(`${server_url}/users/logout`, { username: user.username });
      } catch (err) {
        console.error('Failed to record logout:', err);
      }
    }
    setUser(null);
    navigate('/');
    localStorage.removeItem('ps_user');
  };

  const auth_value = {
    user,
    permissions,
    fetchPermissions,
    login,
    logout,
    server_url,
    bgColor,
    setBgColor
  };

  return (
    <AuthContext.Provider value={auth_value}>
      {children}
    </AuthContext.Provider>
  );
};
