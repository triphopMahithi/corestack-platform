import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  _id: string;
  userId?: string;
  username: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
<<<<<<< HEAD
  loginWithUserData: (rawData: any) => void; // เพิ่ม
=======
  loginWithUserData: (rawData: any) => void;
>>>>>>> main
  logout: () => void;
}
<<<<<<< HEAD

const AuthContext = createContext<AuthContextType>(null as any);
=======
const AuthContext = createContext<AuthContextType>(null as any);
//const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const ADMIN_CREDENTIALS = {
//   username: 'aabbcc',
//   password: '11233'
// };
>>>>>>> main

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    console.log('Stored user from localStorage:', storedUser);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

<<<<<<< HEAD
=======
//const login = async (
//  username: string,
//  password: string,
//  role: 'admin' | 'user' = 'user'
//): Promise<boolean> => {
//  const user: User = { username, role };
//  setUser({ username, role });
//  localStorage.setItem('currentUser', JSON.stringify(user));
//  return true;
//};
>>>>>>> main
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('http://localhost:8080/api/login', {
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

  // ✅ เพิ่ม method loginWithUserData
  const loginWithUserData = (rawData: any) => {
    const mappedUser: User = {
      _id: rawData.userId,
      userId: rawData.userId,
      username: rawData.username,
      role: rawData.role,
    };
    setUser(mappedUser);
    localStorage.setItem('currentUser', JSON.stringify(mappedUser));
    console.log("✅ loginWithUserData saved user:", mappedUser);
  };

  const logout = () => {
    setUser(null);  
    localStorage.removeItem('currentUser');
  };

  return (
<<<<<<< HEAD
    <AuthContext.Provider value={{ user, login, loginWithUserData, logout }}>
      {children}
=======
    <AuthContext.Provider value={{ user, login, loginWithUserData, logout, isAdmin }}>  
    {children}
>>>>>>> main
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
<<<<<<< HEAD
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
=======
  if (!context) throw new Error('useAuth must be used within AuthProvider');  
  
  return context;

};
>>>>>>> main
