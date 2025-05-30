import React, { useState, useEffect } from "react";
import { LoginUser, RegisterUser } from "../utils/api"; // API Calls
import useAuthStore from "@/store/AuthStore"; // Zustand store
import { AuthTabs } from "@/components/AuthTabs";
import { useNavigate, useLocation } from "react-router-dom";

export default function AuthPage() {
  const { logout } = useAuthStore();
  const location = useLocation();
  
  useEffect(() => {
    // Check if we need to clear the auth state
    const params = new URLSearchParams(location.search);
    if (params.get('clearState') === 'true') {
      logout();
    }
  }, [location.search, logout]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [error, setError] = useState("");
  const { login, init } = useAuthStore(); // Zustand store
  const navigate = useNavigate();

  // Restore session on mount
  useEffect(() => {
    init();
  }, []);

  // Login Submission (Fixed)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await LoginUser(email, password);
      const { access_token, user } = data;
      const role = user.role;
      login({ user, token: access_token, role });
      
      // Get redirect URL from query parameters
      const params = new URLSearchParams(location.search);
      let redirect = params.get('redirect');
      
      if (role === "admin" && redirect) {
        try {
          // Decode the URL-encoded redirect parameter
          redirect = decodeURIComponent(redirect);
          console.log('Decoded redirect URL:', redirect);
          
          // Extract path and query parameters if it's a full URL
          if (redirect.startsWith('http')) {
            const url = new URL(redirect);
            redirect = url.pathname + url.search;
          }
          
          console.log('Final redirect path:', redirect);
          navigate(redirect, { replace: true });
          return;
        } catch (e) {
          console.error('Error processing redirect URL:', e);
        }
      }
      
      // Default navigation if no valid redirect
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Registration Submission (Fixed)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await RegisterUser(name, email, password);
      alert("Registration successful!");
      navigate("/Auth"); // Redirect to login page after registration
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* ✅ Pass State Updaters to AuthTabs */}
      <AuthTabs
        onLoginSubmit={handleLoginSubmit}
        onRegisterSubmit={handleRegisterSubmit}
        setEmail={setEmail}
        setPassword={setPassword}
        setName={setName}
      />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}