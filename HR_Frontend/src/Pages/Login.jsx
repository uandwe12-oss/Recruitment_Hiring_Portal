import React, { useState, useEffect } from "react";
import loginImage from "../assets/Images/login.png";
import logo from "../assets/Images/logo.png";
import back from "../assets/Images/back.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animateLogo, setAnimateLogo] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const navigate = useNavigate();

  useEffect(() => {
    setAnimateLogo(true);
  }, []);

  const validate = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
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

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save user info
        localStorage.setItem("user", JSON.stringify(data.user));

        navigate("/dashboard");
      }
      else {
        alert(data.message); // Invalid credentials
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
        className="h-screen overflow-hidden flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${back})` }}
      >
     <div className="relative w-full max-w-6xl">
        <div className="absolute -inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-15" />

        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[760px]">

            {/* LEFT SECTION */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-gray-700 to-black-600 p-3">
              <div
                className={`flex flex-col items-center gap-6 transition-all duration-1000 ${
                  animateLogo ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
              >
                <img src={logo} alt="UANDWE Logo" className="h-24 w-24" />
                <h1 className="text-3xl font-bold text-white">
                  UAW <span className="text-blue-100">Technology</span>
                </h1>
                <p className="text-blue-100 text-center max-w-sm">
                  Internal HR Management Portal  
                  Access restricted to authorized staff only.
                </p>

                <img
                  src={loginImage}
                  alt="Login"
                  className="max-w-[640px] max-h-[350px] mt-6 object-contain"
                />
              </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">

                {/* MOBILE LOGO */}
                <div className="lg:hidden flex justify-center items-center gap-3 mb-8">
                  <img src={logo} className="h-12 w-12" alt="Logo"/>
                  <h1 className="text-xl font-bold">UAW Technology</h1>
                </div>

                {/* HEADER */}
                <div className="mb-8 text-center">
                  <h2 className="text-4xl font-bold text-gray-800 mb-2">
                    HR Management Portal
                  </h2>
                  <h4 className="text-4xl font-medium text-gray-800 mb-2 py-9">
                    Welcome
                  </h4>
                </div>

                {/* FORM */}
                <form onSubmit={handleLogin} className="space-y-6">

                  {/* EMAIL */}
                  <div>
                    <label className="text-lg font-bold text-gray-600 mb-1 block">
                      Username:
                    </label>
                    <input
                      type="text"
                      placeholder="Enter the username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 outline-none ${
                        errors.email
                          ? "border-red-500 focus:ring-red-100"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="text-lg font-bold text-gray-600 mb-1 block">
                      Password:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-4 outline-none ${
                          errors.password
                            ? "border-red-500 focus:ring-red-100"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-100"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                      >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  {/* SUBMIT */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                      isSubmitting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-br from-blue-500 via-gray-700 to-black hover:brightness-110 hover:shadow-xl hover:scale-[1.02] active:scale-95"
                    }`}
                  >
                    {isSubmitting ? "Signing In..." : "Sign In"}
                  </button>

                  {/* FOOTER */}
                  <p className="text-center text-sm text-gray-500 pt-4">
                    © {new Date().getFullYear()} UAW Technology
                  </p>

                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
