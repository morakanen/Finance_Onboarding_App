import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import useAuthStore from "./store/AuthStore";

// Pages...
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./Pages/Homepage";
import AuthPage from "./Pages/Authpage";
import Dashboard from "./Pages/Dashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import ClientDetailsForm from "./Pages/Onboard_Forms/ClientDetailsForm";
import TradingAsForm from "./Pages/Onboard_Forms/TradingAsForm";


const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.5 } },
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
  >
    {children}
  </motion.div>
);

function AnimatedRoutes() {
  const { user, role, loading, init } = useAuthStore();
  const location = useLocation(); // <-- 1) Capture current location

  useEffect(() => {
    init(); 
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <AnimatePresence mode="wait">
      {/* 2) Pass 'location' and 'key' to <Routes> */}
      <Routes key={location.pathname} location={location}>
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

        <Route
          path="/onboarding/client-details"
          element={
            user ? <PageWrapper><ClientDetailsForm /></PageWrapper> : <Navigate to="/auth" />
          }
        />

        <Route
          path="/onboarding/next-step"
          element={
            user ? <PageWrapper><ClientDetailsForm /></PageWrapper> : <Navigate to="/auth" />
          }
        />

        <Route path="/onboarding/trading-as" 
        element={
          user ? <PageWrapper><TradingAsForm /></PageWrapper>
          : <Navigate to="/auth" />} />

      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
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
}