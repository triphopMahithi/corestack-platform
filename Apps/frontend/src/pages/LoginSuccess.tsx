import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const LoginSuccess = () => {
  const navigate = useNavigate();
  const { loginWithUserData } = useAuth();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");

    if (!token) {
      navigate("/");
      return;
    }

    localStorage.setItem("authToken", token);

    axios.get("http://localhost:8080/api/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const { username, role } = res.data;
      console.log("LoginSuccess - role:", role);
      console.log("✅ /api/me response:", res.data);

      // ✅ login ด้วยข้อมูลที่ได้จาก /api/me
      loginWithUserData(res.data);

      navigate(role === "admin" ? "/admin" : "/");
    })
    .catch(() => {
      navigate("/");
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600 text-sm">กำลังเข้าสู่ระบบ กรุณารอสักครู่...</p>
    </div>
  );
};

export default LoginSuccess;
