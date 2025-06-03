import React, { useEffect } from "react";
import "./App.css";
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
import ViewApplicationDetails from "./Pages/ViewApplicationDetails";
import ClientDetailsForm from "./Pages/Onboard_Forms/ClientDetailsForm";
import ClientDetailsFormWrapper from "./Pages/Onboard_Forms/ClientDetailsFormWrapper";
import TradingAsForm from "./Pages/Onboard_Forms/TradingAsForm";
import TradingAsFormWrapper from "./Pages/Onboard_Forms/TradingAsFormWrapper";
import ReferralsForm from "./Pages/Onboard_Forms/ReferralsForm";
import ReferralsFormWrapper from "./Pages/Onboard_Forms/ReferralsFormWrapper";
import AssociationsForm from "./Pages/Onboard_Forms/Associations";
import AssociationsFormWrapper from "./Pages/Onboard_Forms/AssociationsFormWrapper";
import AssignmentsForm from "./Pages/Onboard_Forms/Assignments";
import AssignmentsFormWrapper from "./Pages/Onboard_Forms/AssignmentsFormWrapper";
import KYCForm from "./Pages/Onboard_Forms/KYCform";
import KYCFormWrapper from "./Pages/Onboard_Forms/KYCFormWrapper";
import RiskAssessmentForm from "./Pages/Onboard_Forms/RiskAssessmentForm";
import RiskAssessmentFormWrapper from "./Pages/Onboard_Forms/RiskAssessmentFormWrapper";
import NonAuditForm from "./Pages/Onboard_Forms/NonAuditForm";
import NonAuditFormWrapper from "./Pages/Onboard_Forms/NonAuditFormWrapper";
import FinaliseForm from "./Pages/Onboard_Forms/FinaliseForm";
import FinaliseFormWrapper from "./Pages/Onboard_Forms/FinaliseFormWrapper";


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
  path="/onboarding/client-details/:applicationId"
  element={
    user ? (
      <PageWrapper>
        <ClientDetailsFormWrapper />
      </PageWrapper>
    ) : (
      <Navigate to="/auth" />
    )
  }
/>

        <Route
          path="/onboarding/next-step"
          element={
            user ? <PageWrapper><ClientDetailsForm /></PageWrapper> : <Navigate to="/auth" />
          }
        />

        <Route path="/onboarding/trading-as/:applicationId" 
        element={
          user ? <PageWrapper><TradingAsFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/referrals/:applicationId"
        element={
          user ? <PageWrapper><ReferralsFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/associations/:applicationId"
        element={
          user ? <PageWrapper><AssociationsFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/assignments/:applicationId"
        element={
          user ? <PageWrapper><AssignmentsFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/kyc/:applicationId"
        element={
          user ? <PageWrapper><KYCFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/risk-assessment/:applicationId"
        element={
          user ? <PageWrapper><RiskAssessmentFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/non-audit/:applicationId"
        element={
          user ? <PageWrapper><NonAuditFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/onboarding/finalise/:applicationId"
        element={
          user ? <PageWrapper><FinaliseFormWrapper /></PageWrapper>
          : <Navigate to="/auth" />} />

        <Route path="/applications/:applicationId"
        element={
          user ? <PageWrapper><ViewApplicationDetails /></PageWrapper>
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