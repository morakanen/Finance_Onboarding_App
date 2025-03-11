// src/App.jsx
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useAuthStore from "./store/AuthStore"; // Import Zustand store

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./Pages/Homepage";
import AuthPage from "./Pages/Authpage"; // Auth Page (Login/Register)
import Dashboard from "./Pages/Dashboard"; // Client Dashboard
import AdminDashboard from "./Pages/AdminDashboard"; // Admin Dashboard

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.5 } }
};

const PageWrapper = ({ children }) => (
  <motion.div initial="initial" animate="animate" exit="exit" variants={pageVariants}>
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const { user, role, loading, init } = useAuthStore(); // Get auth store state

  useEffect(() => {
    init(); // Initialize auth state on app load
  }, []);

  if (loading) return <div>Loading...</div>; // Prevents infinite loading

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
        <Route
          path="/dashboard"
          element={user ? <PageWrapper><Dashboard /></PageWrapper> : <Navigate to="/auth" />}
        />
        <Route
          path="/admin/dashboard"
          element={role === "admin" ? <PageWrapper><AdminDashboard /></PageWrapper> : <Navigate to="/auth" />}
        />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-zinc-900 text-white">
      <Router>
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center w-full px-6">
          <AnimatedRoutes />
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;
