import React from "react";
import "./App.css"; // Import global styles
import Header from "./frontend/src/Components/Header.js";
import Footer from "./frontend/src/Components/Footer.js";
import ClientForm from "./frontend/src/Pages/Testform.js";

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


