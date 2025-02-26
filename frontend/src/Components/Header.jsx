import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-zinc-800 text-white p-4 shadow-md border-b-2 border-orange-500">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client Onboarding</h1>
        <nav className="space-x-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-orange-400">
              Home
            </Button>
          </Link>
          <Link to="/add-client">
            <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
              Add Client
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;