// src/pages/Authpage.jsx
// src/pages/Authpage.jsx
import { useState, useEffect } from "react";
import { LoginUser, RegisterUser } from "../utils/api"; // Import API calls
import useAuthStore from "../store/AuthStore"; // Zustand store
import { AuthTabs } from "@/components/AuthTabs";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [error, setError] = useState("");
  const { login } = useAuthStore(); // Zustand store

  useEffect(() => {
    useAuthStore.getState().init(); // Initialize Zustand state (check for token in localStorage)
  }, []);

  // ✅ Login Submission (Fixed)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await LoginUser(email, password);
      const { access_token, role, user } = data;
      login({ user, token: access_token, role });
      alert("Login successful!");
      window.location.href = role === "admin" ? "/admin/dashboard" : "/dashboard";
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Registration Submission (Fixed)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await RegisterUser(name, email, password); // Pass correct order
      alert("Registration successful!");
      window.location.href = "/Auth";
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