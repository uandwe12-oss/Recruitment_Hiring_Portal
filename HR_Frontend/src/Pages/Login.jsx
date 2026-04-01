import React, { useState, useEffect } from "react";
import loginImage from "../assets/Images/company.png";
import logo from "../assets/Images/logo.png";
import back from "../assets/Images/back.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const navigate = useNavigate();

  // Validate both fields
  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Username is required";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Clear error for a specific field when user starts typing
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validate before submitting
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("https://myuandwe-bg.vercel.app/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save user to localStorage
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on user role
        const userRole = data.user.role;

        if (userRole === "Client Interviewer") {
          // Client Interviewer goes directly to demand page
          navigate("/demand");
        }
        else if (userRole === "Interviewer") {
          // Interviewer goes to demand page
          navigate("/demand");
        }
        else if (userRole === "Admin" || userRole === "Recruiter") {
          // Admin and Recruiter go to home page
          navigate("/home");
        }
        else {
          // Default fallback
          navigate("/home");
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Server error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat font-sans"
      style={{ backgroundImage: `url(${back})` }}
    >
      {/* Main Container */}
      <div className="relative w-[95%] max-w-5xl h-[600px] flex shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-md border border-white/20">

        {/* LEFT SECTION - The Dynamic Professional Image */}
        <div className="hidden lg:block w-1/2 h-full overflow-hidden border-r border-gray-100">
          <img
            src={loginImage}
            alt="Professional Workspace"
            className="w-full h-full transition-transform duration-700 hover:scale-105"
          />
        </div>

        {/* RIGHT SECTION - The Login Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-14 bg-white/40">
          <div className="w-full max-w-sm mx-auto">

            {/* Branding Area */}
            <div className="text-center mb-8">
              <img src={logo} alt="UAW Logo" className="h-16 mx-auto mb-4 object-contain" />
<h1 className="text-2xl font-bold text-orange-500 mb-2">
  myuandwe
  <span className="ml-2 text-2xl font-bold text-slate-800 tracking-tight">
    Knowledge Base
  </span>
</h1>

              <p className="text-md font-medium mt-1 text-slate-600">Welcome</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">

              {/* Username Field */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-3 bg-white/60 border rounded-xl outline-none transition-all focus:ring-4 ${errors.email
                      ? "border-red-400 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                    }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 bg-white/60 border rounded-xl outline-none transition-all focus:ring-4 ${errors.password
                        ? "border-red-400 focus:ring-red-500/10"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors text-lg cursor-pointer"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-1 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${isSubmitting
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-br from-blue-500 via-gray-700 to-black hover:brightness-110 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                  }`}
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>

              {/* Footer text */}
              <div className="pt-6 text-center">
                <p className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                  © {new Date().getFullYear()} uandwe
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
