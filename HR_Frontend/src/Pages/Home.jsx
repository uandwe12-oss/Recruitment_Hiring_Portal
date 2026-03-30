import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Images/logo.png";
import sideImage from "../assets/Images/head.png";
 import ReactCountryFlag from "react-country-flag";
import {
  User,
  FileText,
  Calendar,
  Users,
  Receipt,
  CalendarClock,
  Shield,
  DollarSign,
  Briefcase,
  ClipboardList,
  Plane,
  BookOpen,
  Laptop,
  Award,
  Search,
  Mail,
  UserCircle,
  Globe,
  Bell,
  Clock,
  MapPin,
  MessageCircle,
  NewspaperIcon
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDevelopmentMessage, setShowDevelopmentMessage] = useState(false);
  const [developmentMessage, setDevelopmentMessage] = useState("");
const [locations, setLocations] = useState([
  { name: "USA", code: "US", active: false },
  { name: "India", code: "IN", active: true },
  { name: "China", code: "CN", active: false }
]);
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setUserName(storedUser.name || storedUser.username);
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
  localStorage.removeItem("user");
  navigate("/");
};


  const formattedTime = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const formattedDate = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

const handleLocationClick = (clickedIndex) => {
  const updated = locations.map((loc, index) => ({
    ...loc,
    active: index === clickedIndex
  }));
  setLocations(updated);
};



  const allCards = [
    { icon: <User />, title: "My Personal Details" },
    { icon: <FileText />, title: "Policies" },
    { icon: <Calendar />, title: "Holiday Calendar" },
    { icon: <Users />, title: "Recruitment" },
    { icon: <Receipt />, title: "Reimbursements" },
    { icon: <CalendarClock />, title: "Leave Application" },
    { icon: <Shield />, title: "Insurance" },
    { icon: <DollarSign />, title: "Payroll" },
    { icon: <Briefcase />, title: "My Client" },
    { icon: <Award />, title: "UANDWE Awards" },
    { icon: <ClipboardList />, title: "Code of Conduct" },
    { icon: <Users />, title: "Employee Transfer" },
    { icon: <DollarSign />, title: "Salary Advance" },
    { icon: <Users />, title: "My Team" },
    { icon: <Plane />, title: "Travel" },
    { icon: <BookOpen />, title: "Training" },
    { icon: <Laptop />, title: "My Assets" },
    { icon: <NewspaperIcon />, title: "News Feeder" }
  ];

  const filteredCards = allCards.filter(card => 
    card.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

 const handleCardClick = (title) => {
  if (title === "Recruitment") {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    const userRole = user?.role;
    
    // If user is Interviewer, navigate to Demand page
    if (userRole === "Interviewer") {
      navigate("/demand");
    } else {
      // For Admin and Recruiter, navigate to Recruitment page
      navigate("/recruitment");
    }
  } else {
    // Show development message for other cards
    setDevelopmentMessage(`UANDWE Knowledge Base: "${title}" is under development`);
    setShowDevelopmentMessage(true);
    setTimeout(() => {
      setShowDevelopmentMessage(false);
    }, 3000);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Development Message Toast */}
      {showDevelopmentMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideInDown">
          <div className="bg-gray-900 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 min-w-[400px]">
            <span className="text-yellow-400 text-xl">🚧</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{developmentMessage}</p>
            </div>
            <button 
              onClick={() => setShowDevelopmentMessage(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* HEADER */}
      <div className="relative w-full bg-gradient-to-r from-gray-900 via-gray-900 to-blue-900 overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
        
        <div className="max-w-10xl mx-auto flex items-center justify-between relative">
          <div className="flex items-center gap-4 p-6 w-1/2 animate-slideInLeft">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <img 
                src={logo} 
                alt="logo" 
                className="relative h-27 w-27 object-contain transform group-hover:scale-110 transition-transform duration-300"
              />
            </div>

            <div className="relative">
<h1 className="text-5xl font-bold text-orange-400 mb-2">
  myuandwe
</h1>
              <h1 className="text-4xl font-bold text-white mb-2">
                Knowledge Base
              </h1>
              <p className="text-blue-200 text-lg relative">
                Self service platform for all HR systems, policies and guidance
                <span className="absolute -bottom-1 left-0 w-20 h-0.5 bg-gradient-to-r from-blue-400 to-transparent"></span>
              </p>
            </div>
          </div>

<div className="absolute top-6 right-6 z-50">
  <button
    onClick={handleLogout}
    className="px-4 py-2 rounded-xl text-sm font-semibold 
    bg-white/10 backdrop-blur-md border border-white/20 
    text-white shadow-lg 
    hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 
    transition-all duration-300"
  >
    Logout
  </button>
</div>

          <div className="w-2/3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gray-900 z-10"></div>
            <img
              src={sideImage}
              alt="banner"
              className="w-full h-82 object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute top-10 right-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
            <div className="absolute bottom-10 left-10 w-3 h-3 bg-blue-400 rounded-full animate-ping animation-delay-1000"></div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <section className="relative px-8 py-8 max-w-9xl mx-auto z-10">

        {/* WELCOME + SEARCH + HR CONTACT */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-4 mb-6 -mt-2 animate-slideInDown">
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <UserCircle className="relative h-10 w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Welcome,
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-bold ml-2">
                    {userName || "Employee"}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">{formattedDate} • {formattedTime}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-72 group">
                <input
                  type="text"
                  placeholder="Search anything..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-4 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/50 backdrop-blur-sm group-hover:shadow-lg"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

<div 
  onClick={() => {
    // Open Outlook Web compose with HR email
    const hrEmail = "swathi@uandwe.com";
    const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(hrEmail)}`;
    window.open(outlookComposeUrl, '_blank');
  }}
  className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-xl border border-blue-100 hover:shadow-lg transition-all group cursor-pointer"
>
  <div className="relative">
    <Mail className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
  </div>
  <div>
    <p className="text-xs text-gray-500"> HR Support</p>
    {/* <span className="text-sm font-medium text-blue-600 group-hover:text-purple-600 transition-colors">
      swathi@uandwe.com
    </span> */}
  </div>
</div>
            </div>
          </div>
        </div>

        {/* Location Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200 inline-flex">
            {locations.map((location, index) => (
<button
  key={index}
  onClick={() => handleLocationClick(index)}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border
      ${
        location.active
          ? "bg-blue-600 text-white border-blue-600 shadow-md"
          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
      }`}
  >
    <ReactCountryFlag
      countryCode={location.code}
      svg
      style={{ width: "18px", height: "18px" }}
    />
    {location.name}
  </button>
))}
          </div>
        </div>

        {/* ALL WIDGETS - Unified Section with Centered Last Row */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            {/* <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-semibold text-gray-800">Knowledge Base</h3>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                {filteredCards.length} items
              </span>
            </div> */}
          </div>

          {/* Cards Grid with Last Row Centered */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredCards.map((card, index) => (
              <ProfessionalCard
                key={index}
                icon={card.icon}
                title={card.title}
                index={index}
                onClick={() => handleCardClick(card.title)}
              />
            ))}
          </div>
          
          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Live Chat Support */}
        {/* <div className="fixed bottom-6 right-6 z-30">
          <button className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all group-hover:scale-110">
              <MessageCircle className="h-6 w-6" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
          </button>
        </div> */}

        {/* FOOTER */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* <div className="flex items-center gap-2">
              <img src={logo} alt="UANDWE" className="h-8 w-8 object-contain opacity-70" />
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} UANDWE Technologies
              </p>
            </div> */}
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Terms of Use
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                Support
              </a>
            </div>
            <p className="text-sm text-gray-400">
              Employee Knowledge Base v2.0
            </p>
          </div>
        </footer>
      </section>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out;
        }
        @keyframes slideInDown {
          from { transform: translateY(-100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideInDown {
          animation: slideInDown 0.6s ease-out;
        }
        @keyframes fadeInScale {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

  const ProfessionalCard = ({ icon, title, index, onClick }) => {
    return (
      <div
        className="relative group"
        onClick={onClick}
        style={{
          animation: `fadeInScale 0.4s ease-out ${index * 0.05}s both`
        }}
      >
        {/* Card */}
       <div className="
  relative bg-white rounded-xl p-5
  border border-blue-500
  shadow-sm
  transition-all duration-300 cursor-pointer
  group-hover:border-purple-600
">
          
          {/* Icon */}
          <div className="mb-3">
            <div className="
              inline-flex p-2.5 rounded-lg
              bg-gray-50 text-gray-600
              transition-all duration-300
              group-hover:bg-blue-100 group-hover:text-blue-600
            ">
              {React.cloneElement(icon, {
                className: "h-5 w-5 transition-transform duration-300 group-hover:scale-110"
              })}
            </div>
          </div>

          {/* Title */}
          <h4 className="
            text-sm font-medium text-gray-700
            transition-colors duration-300
            group-hover:text-blue-600
          ">
            {title}
          </h4>

        </div>
      </div>
    );
  };

export default Home;
