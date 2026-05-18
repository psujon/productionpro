import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuthContext = () => {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const server_url = `http://${window.location.hostname}:5172`;
  const navigate = useNavigate();

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [recentMessages, setRecentMessages] = useState([]);
  const [unresolvedTickets, setUnresolvedTickets] = useState({ count: 0, tickets: [] });

  const fetchPermissions = async (username) => {
    try {
      const res = await axios.post(`${server_url}/users/permissions/get`, { username });
      setPermissions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const fetchUnreadCount = async (username) => {
    try {
      const res = await axios.post(`${server_url}/community/unread-count`, { username });
      setUnreadCount(res.data.count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const fetchRecentMessages = async (username) => {
    try {
      const res = await axios.post(`${server_url}/community/list`, {
        username,
        other_username: null, // special case for recent overall
        is_recent: true
      });
      setRecentMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch recent messages:', err);
    }
  };

  const fetchUnresolvedTickets = async () => {
    try {
      const res = await axios.get(`${server_url}/tickets/unresolved`);
      setUnresolvedTickets(res.data);
    } catch (err) {
      console.error('Failed to fetch unresolved tickets:', err);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchPermissions(user.username);
      fetchUnreadCount(user.username);
      fetchRecentMessages(user.username);

      if (user.role === 'Admin') {
        fetchUnresolvedTickets();
      }

      const interval = setInterval(() => {
        fetchUnreadCount(user.username);
        fetchRecentMessages(user.username);
        if (user.role === 'Admin') {
          fetchUnresolvedTickets();
        }
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(interval);
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
    unreadCount,
    fetchUnreadCount,
    recentMessages,
    fetchRecentMessages,
    activeChatUser,
    setActiveChatUser,
    unresolvedTickets,
    fetchUnresolvedTickets,
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
