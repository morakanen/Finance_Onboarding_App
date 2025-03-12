import { useState, useEffect } from "react";
import { LoginUser, RegisterUser } from "../utils/api"; // API Calls
import useAuthStore from "../store/AuthStore"; // Zustand store
import { AuthTabs } from "@/components/AuthTabs";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [error, setError] = useState("");
  const { login, init } = useAuthStore(); // Zustand store
  const navigate = useNavigate();

  // ✅ Restore session on mount
  useEffect(() => {
    init();
  }, []);

  // ✅ Login Submission (Fixed)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await LoginUser(email, password);
      const { access_token, role, user } = data;
      login({ user, token: access_token, role }); // Save login data
      alert("Login successful!");
      navigate(role === "admin" ? "/admin/dashboard" : "/dashboard"); // Redirect after login
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Registration Submission (Fixed)
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