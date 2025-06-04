import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LoginUser, RegisterUser } from "../utils/api"; // API Calls
import useAuthStore from "@/store/AuthStore"; // Zustand store
import { AuthTabs } from "@/components/AuthTabs";
import { useNavigate, useLocation } from "react-router-dom";

// Animated background components
const FloatingParticle = ({ index }) => {
  const size = Math.random() * 10 + 5;
  const duration = Math.random() * 15 + 10;
  const initialX = Math.random() * 100;
  const initialY = Math.random() * 100;
  const delay = Math.random() * 5;

  return (
    <motion.div
      className="absolute rounded-full bg-orange-500/10"
      style={{
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}%`,
      }}
      animate={{
        x: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
        y: [0, Math.random() * 100 - 50, Math.random() * 100 - 50, 0],
        opacity: [0, 0.5, 0.5, 0],
        scale: [0, 1, 1, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
    />
  );
};

const GradientBackground = () => {
  return (
    <motion.div
      className="fixed top-16 inset-x-0 bottom-0 w-full -z-10" // Top-16 to leave space for header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900"
        animate={{
          background: [
            "linear-gradient(to bottom right, #18181b, #27272a, #18181b)",
            "linear-gradient(to bottom right, #18181b, #292524, #18181b)",
            "linear-gradient(to bottom right, #18181b, #1c1917, #18181b)",
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Light beam effect */}
      <motion.div
        className="absolute top-0 left-1/4 w-1/2 h-full bg-orange-500/5 blur-3xl"
        animate={{
          x: ["-25%", "25%", "-25%"],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "reverse" }}
      />

      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, index) => (
        <FloatingParticle key={index} index={index} />
      ))}

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMyNzI3MmEiIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBoMzB2MzBIMzB6TTAgMzBoMzB2MzBIMHoiIGZpbGw9IiMxODE4MWIiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9nPjwvc3ZnPg==')]" style={{ opacity: 0.4, backgroundSize: '60px 60px' }} />
    </motion.div>
  );
};

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
  }, [init]);

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
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center p-4 overflow-hidden">
      {/* Animated background */}
      <GradientBackground />
      
      {/* Auth component with glass effect */}
      <motion.div 
        className="relative z-10 backdrop-blur-sm bg-zinc-900/30 p-6 rounded-2xl shadow-xl border border-zinc-800/50"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <AuthTabs
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          setEmail={setEmail}
          setPassword={setPassword}
          setName={setName}
        />
        {error && (
          <motion.p 
            className="text-red-500 mt-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
      
      {/* Footer */}
      <motion.div 
        className="absolute bottom-4 text-zinc-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        &copy; {new Date().getFullYear()} Finance Onboarding Portal
      </motion.div>
    </div>
  );
}