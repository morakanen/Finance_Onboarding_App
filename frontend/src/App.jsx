import React from "react";
import "./App.css"; // Import global styles

const App = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-lg text-center">
        <h1 className="text-2xl font-bold">Finance Onboarding System</h1>
        <p className="mt-2">Welcome! Start onboarding new clients.</p>
        <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
          Start Onboarding
        </button>
      </div>
    </div>
  );
};

export default App;


