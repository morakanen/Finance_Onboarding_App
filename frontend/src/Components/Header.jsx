import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import useAuthStore from "../store/AuthStore";

const Header = () => {
  const { user, logout, init, role } = useAuthStore();
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
    <header className="bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-4 shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-90">
      <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <span className="text-white text-lg font-bold">F</span>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Client Onboarding</h1>
        </div>
        <nav className="flex items-center space-x-4">
          <Link to={user ? (role === "admin" ? "/admin/dashboard" : "/dashboard") : "/"}>
            <Button variant="ghost" className="text-white hover:text-orange-400 hover:scale-105 transition-all duration-200">
              {user ? "Dashboard" : "Home"}
            </Button>
          </Link>

          {user ? (
            // Show Logout Button & User Email
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-200 font-medium text-sm">{user.email}</span>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
              >
                Logout
              </Button>
            </div>
          ) : (
            // Show Login/Register Button when NOT logged in
            <Link to="/Auth">
              <Button
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20"
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