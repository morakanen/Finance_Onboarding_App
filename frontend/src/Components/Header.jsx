import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useAuthStore from "../store/AuthStore";

const Header = () => {
  const { user, logout, init } = useAuthStore();
  const navigate = useNavigate();

  // ✅ Restore session on page load
  useEffect(() => {
    init();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/Auth"); // Redirect to login page after logout
  };

  return (
    <header className="bg-zinc-800 text-white p-4 shadow-md border-b-2 border-orange-500">
      <div className="flex justify-between items-center w-full px-6">
        <h1 className="text-2xl font-bold">Client Onboarding</h1>
        <nav className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" className="text-white hover:text-orange-400">
              Home
            </Button>
          </Link>

          {user ? (
            // ✅ Show Logout Button & User Email
            <div className="flex items-center space-x-3">
              <span className="text-orange-400 font-medium">{user.email}</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                Logout
              </Button>
            </div>
          ) : (
            // ✅ Show Login/Register Button when NOT logged in
            <Link to="/Auth">
              <Button
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                Login/Register
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;