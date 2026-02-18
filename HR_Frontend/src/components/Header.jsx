import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/Images/logo.png";

const Header = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "User";
  const role = user?.role || "Recruiter";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const navItem = (label, path) => {
    const isActive = location.pathname === path;

    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        className={`px-3 py-1 text-sm font-semibold transition-colors
          ${
            isActive
              ? "text-blue-600"
              : "text-gray-700 hover:text-blue-500"
          }`}
      >
        {label}
      </button>
    );
  };

  // Check if user is Admin
  const isAdmin = role === "Admin";

  return (
    <header className="w-full sticky top-0 z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-20 blur-2xl"></div>

      <div className="relative bg-white/80 backdrop-blur-xl shadow-lg border-b border-white/40">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 bg-white">

          {/* LEFT: Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/home")}
          >
            <img
              src={logo}
              alt="UAW Technology"
              className="h-10 w-10 rounded-lg shadow-md"
            />
            <h1 className="text-xl font-bold text-gray-800">
              UAW <span className="text-blue-600">Technologies</span>
            </h1>
          </div>

          {/* CENTER: Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItem("Home", "/home")}
            {navItem("Demand", "/demand")}
            {navItem("Recruiter", "/recruiter")}
            {/* Show Create User link only for Admin */}
            {isAdmin && navItem("Create User", "/create-user")}
          </div>

          {/* RIGHT: User Profile */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/60 hover:bg-white shadow-md transition-all"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>

              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-gray-800">{username}</p>
                <p className="text-xs text-gray-500 capitalize">{role}</p>
              </div>

              <span className="text-gray-500">▾</span>
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-semibold">{username}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {role} • {username}@uawtech.com
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;