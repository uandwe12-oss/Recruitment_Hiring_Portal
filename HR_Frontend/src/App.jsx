import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login";
import Home from "./Pages/Home";
import Demand from "./Pages/Demand";
import Recruiter from "./Pages/Recruiter";
import CreateUser from "./Pages/CreateUser";
import R_home from "./Pages/R_home.jsx";

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user is Client Interviewer
  const isClientInterviewer = user.role === "Client Interviewer";
  
  // If user is Client Interviewer and trying to access home page, redirect to demand
  if (isClientInterviewer && window.location.pathname === "/home") {
    return <Navigate to="/demand" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  
  // Pass the user to the child component
  return React.cloneElement(children, { user });
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />

      {/* Protected Routes - All users can access these */}
      <Route
        path="/demand"
        element={
          <ProtectedRoute>
            <Demand />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      
      {/* Recruiter page - Only accessible by Admin and Recruiter */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute allowedRoles={["Admin", "Recruiter"]}>
            <Recruiter />
          </ProtectedRoute>
        }
      />

      {/* Recruitment page - For all roles */}
      <Route path="/recruitment" element={<R_home />} />

      {/* Admin Only Route */}
      <Route
        path="/create-user"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <CreateUser />
          </ProtectedRoute>
        }
      />

      {/* Default landing after login */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      
      {/* Catch all - redirect to home if authenticated, otherwise login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;