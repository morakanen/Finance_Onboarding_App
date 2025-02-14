import React from "react";
import "./App.css"; // Import global styles
import Header from "./Components/Header";
import Footer from "./Components/Footer";
import ClientForm from "./Pages/TestForm";

const App = () => {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<h2>Welcome to Client Onboarding</h2>} />
        <Route path="/add-client" element={<ClientForm />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;


