import React, { createContext, useContext, useState, useEffect } from 'react';
import { config } from "@/config";

interface User {
  _id: string;
  userId?: string;
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginWithUserData: (rawData: { userId: string; username: string; role: 'admin' | 'user' }) => void;
  logout: () => void;
  isAdmin: boolean;
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => false,
  loginWithUserData: () => {},
  logout: () => {},
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    console.log('Stored user from localStorage:', storedUser);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(config.LocalLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return false;

      const rawData = await res.json();
      console.log('Login response:', rawData);
      const mappedUser: User = {
        _id: rawData.userId,
        userId: rawData.userId,
        username: rawData.username,
        role: rawData.role,
      };
      setUser(mappedUser);
      localStorage.setItem('currentUser', JSON.stringify(mappedUser));
      return true;
    } catch (err) {
      console.error('Login failed', err);
      return false;
    }
  };

  // method loginWithUserData
  const loginWithUserData = (rawData: { userId: string; username: string; role: 'admin' | 'user' }) => {
    const mappedUser: User = {
      _id: rawData.userId,
      userId: rawData.userId,
      username: rawData.username,
      role: rawData.role,
    };
    setUser(mappedUser);
    localStorage.setItem('currentUser', JSON.stringify(mappedUser));
    console.log("loginWithUserData saved user:", mappedUser);
  };

  const logout = () => {
    setUser(null);  
    localStorage.removeItem('currentUser');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, loginWithUserData, logout, isAdmin }}>  
    {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');  
  
  return context;

};
