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
      <Route path="/dashboard" element={<Navigate to="/home" />} />
      
      {/* Catch all - redirect to home if authenticated, otherwise login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
