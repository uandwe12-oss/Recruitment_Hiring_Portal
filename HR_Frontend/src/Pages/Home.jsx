import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import bgImage from "../assets/Images/back.png";
import {
  Briefcase,
  Users,
  ClipboardList,
  Globe
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    /* BACKGROUND IMAGE */
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* OVERLAY FOR READABILITY */}
      <div className="min-h-screen bg-white/50 backdrop-blur-sm">
        <Header />

        {/* HERO SECTION */}
        <section className="px-8 pt-16 pb-20 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

            {/* LEFT */}
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                UANDWE Recruitment <br />
                <span className="text-blue-600">Hiring Portal</span>
              </h1>

              <p className="mt-6 text-lg text-gray-600 max-w-xl">
                A centralized platform designed to manage job demands, recruiter
                workflows, and candidate profiles with accuracy, speed, and
                complete control.
              </p>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => navigate("/demand")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
                >
                  View Demand Dashboard
                </button>

                <button
                  onClick={() => navigate("/recruiter")}
                  className="px-6 py-3 border border-gray-800 rounded-xl hover:bg-gray-300 transition"
                >
                  Recruiter Workspace
                </button>
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Portal Highlights</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>✔ Secure recruiter & admin access</li>
                  <li>✔ Centralized candidate database</li>
                  <li>✔ Demand ageing & priority tracking</li>
                  <li>✔ Website job posting integration</li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section className="px-8 pb-20 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-blue-700 mb-10 text-center">
            What You Can Do
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

            <FeatureCard
              icon={<ClipboardList className="h-8 w-8 text-blue-600" />}
              title="Demand Management"
              text="Create, track, and manage open positions with status and ageing visibility."
            />

            <FeatureCard
              icon={<Users className="h-8 w-8 text-blue-600" />}
              title="Candidate Database"
              text="Store, search, and reuse candidate profiles securely and efficiently."
            />

            <FeatureCard
              icon={<Briefcase className="h-8 w-8 text-blue-600" />}
              title="Recruiter Workflow"
              text="Upload resumes, avoid duplication, and collaborate seamlessly."
            />

            <FeatureCard
              icon={<Globe className="h-8 w-8 text-blue-600" />}
              title="Job Posting"
              text="Publish jobs to the UANDWE website with one click and track applications."
            />

          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-center py-6 text-sm text-gray-500 border-t">
          © {new Date().getFullYear()} UANDWE Technologies — Recruitment Management System
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, text }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
    <div className="mb-4">{icon}</div>
    <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
    <p className="text-sm text-gray-600">{text}</p>
  </div>
);

export default Home;
