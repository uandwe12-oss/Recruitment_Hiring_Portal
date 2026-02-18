import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login";
import Home from "./Pages/Home";
import Demand from "./Pages/Demand";
import Recruiter from "./Pages/Recruiter";
import CreateUser from "./Pages/CreateUser"; // You'll create this next

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/demand"
        element={
          <ProtectedRoute>
            <Demand />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute>
            <Recruiter />
          </ProtectedRoute>
        }
      />

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
      <Route path="/dashboard" element={<Navigate to="/home" />} />
      
      {/* Catch all - redirect to home if authenticated, otherwise login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;