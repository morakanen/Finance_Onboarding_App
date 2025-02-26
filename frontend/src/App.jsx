import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css"; // Import global styles

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import HomePage from "./Pages/HomePage";
import OnboardingForm from "./Pages/OnboardingForm";

const App = () => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-zinc-900 text-white overflow-hidden">
      <Router>
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center w-full px-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/onboarding/:step" element={<OnboardingForm />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </div>
  );
};

export default App;