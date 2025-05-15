import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-zinc-900 text-white px-6">
      <h1 className="text-4xl font-bold mb-4 text-center">Welcome to Client Onboarding</h1>
      <p className="text-zinc-400 max-w-lg text-center mb-6">
        Get started with your onboarding process or continue from where you left off.
      </p>
      <div className="flex space-x-4">
        <Link to="/onboarding/client-details">
          <Button className="bg-orange-500 text-white px-6 py-3 rounded-lg border-2 border-orange-400 hover:bg-orange-600">
            Start New Form
          </Button> 
        </Link>
        <Link to="/dashboard">
          <Button className="bg-transparent text-orange-500 px-6 py-3 rounded-lg border-2 border-orange-500 hover:bg-orange-500 hover:text-white">
            View Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;