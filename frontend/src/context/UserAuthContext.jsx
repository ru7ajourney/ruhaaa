import { createContext, useContext, useState, useEffect } from "react";
import { userAPI } from "../api";

const UserAuthContext = createContext(null);

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("ruha_user_token");
    if (!token) { setLoading(false); return; }
    userAPI.getMe()
      .then(({ data }) => setUser(data.user))
      .catch((err) => {
        // فقط احذف التوكن إذا كان الرد 401 (توكن منتهي أو غير صالح)
        if (err.response?.status === 401) {
          localStorage.removeItem("ruha_user_token");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (token, userData) => {
    localStorage.setItem("ruha_user_token", token);
    setUser(userData);
  };

  const logout = async () => {
    setLoggingOut(true);
    await new Promise((r) => setTimeout(r, 1500));
    localStorage.removeItem("ruha_user_token");
    setUser(null);
    setLoggingOut(false);
  };

  return (
    <UserAuthContext.Provider value={{ user, loading, loggingOut, login, logout }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => useContext(UserAuthContext);
