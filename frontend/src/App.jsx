import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import "./App.css"; // Tailwind global styles

import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./Pages/Homepage";
import OnboardingForm from "./Pages/OnBoardingForm";
import AuthPage from "./Pages/Authpage"; // Import the AuthPage component

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
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Route to Home Page */}
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        
        {/* Route to Auth Page */}
        <Route path="/Auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
        
        {/* Onboarding step route */}
        <Route path="/onboarding/:step" element={<PageWrapper><OnboardingForm /></PageWrapper>} />
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
