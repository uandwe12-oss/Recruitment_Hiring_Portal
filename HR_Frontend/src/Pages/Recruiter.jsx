import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import bgImage from "../assets/Images/back.png";
import { 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  FileText,
  MessageSquare,
  XCircle,
  Plus,
  Filter,
  Download,
  Shield,
  Loader,
  Code,
  Users,
  BarChart,
  User,
  GraduationCap,
  Calendar,
  Globe,
  Award,
  Save,
  X,
  CheckCircle,
  PlusCircle,
  Trash2,
  DollarSign
} from "lucide-react";
import axios from "axios";

const Recruiter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  // State for API data
  const [candidates, setCandidates] = useState([]);
  const [displayedCandidates, setDisplayedCandidates] = useState([]);
  const [skillGroups, setSkillGroups] = useState([]);
  const [skillStats, setSkillStats] = useState(null);
  const [totalSkills, setTotalSkills] = useState(0);
  
  // Search filter state
  const [searchFilters, setSearchFilters] = useState({
    skills: [],
    experienceMin: "",
    experienceMax: "",
    location: "",
    salaryMin: "",
    salaryMax: ""
  });

  // Available locations for dropdown
  const [availableLocations, setAvailableLocations] = useState([]);
  
  // Form state for new profile
  const [newProfile, setNewProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    location: "",
    visaStatus: "",
    passport: "",
    experience: "",
    currentRole: "",
    skills: [],
    status: "Available",
    noticePeriod: "",
    salary: "",
    education: "",
    bio: ""
  });

  // Skill input state for manual entry
  const [skillInput, setSkillInput] = useState("");

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Helper function to parse salary string to number
  const parseSalary = (salaryStr) => {
    if (!salaryStr) return 0;
    // Extract numbers from salary string (e.g., "₹18 LPA" -> 18)
    const match = salaryStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Fetch all candidates from API
  const fetchAllCandidates = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/candidates');
      if (response.data.success) {
        setCandidates(response.data.data);
        setDisplayedCandidates(response.data.data);
        
        // Extract locations for dropdown
        const locations = new Set();
        response.data.data.forEach(candidate => {
          if (candidate.location) {
            const city = candidate.location.split(',')[0].trim();
            locations.add(city);
          }
        });
        setAvailableLocations(Array.from(locations).sort());
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch skills data from API
  const fetchSkillsData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/candidates/skills');
      if (response.data.success) {
        setSkillGroups(response.data.data);
        setTotalSkills(response.data.totalSkills);
      }
    } catch (err) {
      console.error('Error fetching skills data:', err);
    }
  };

  // Apply search filters
  const applySearchFilters = () => {
    let filtered = [...candidates];

    // Filter by multiple skills (if any selected)
    if (searchFilters.skills && searchFilters.skills.length > 0) {
      filtered = filtered.filter(candidate => 
        candidate.skills && searchFilters.skills.some(skill => 
          candidate.skills.includes(skill)
        )
      );
    }

    // Filter by experience range - only if values are provided
    if (searchFilters.experienceMin && searchFilters.experienceMin !== "") {
      filtered = filtered.filter(candidate => {
        const exp = parseInt(candidate.experience) || 0;
        return exp >= parseInt(searchFilters.experienceMin);
      });
    }

    if (searchFilters.experienceMax && searchFilters.experienceMax !== "") {
      filtered = filtered.filter(candidate => {
        const exp = parseInt(candidate.experience) || 0;
        return exp <= parseInt(searchFilters.experienceMax);
      });
    }

    // Filter by location - exact match of city
    if (searchFilters.location && searchFilters.location !== "") {
      filtered = filtered.filter(candidate => {
        if (!candidate.location) return false;
        const city = candidate.location.split(',')[0].trim();
        return city.toLowerCase() === searchFilters.location.toLowerCase();
      });
    }

    // Filter by salary range
    if (searchFilters.salaryMin && searchFilters.salaryMin !== "") {
      filtered = filtered.filter(candidate => {
        const salary = parseSalary(candidate.salary);
        return salary >= parseInt(searchFilters.salaryMin);
      });
    }

    if (searchFilters.salaryMax && searchFilters.salaryMax !== "") {
      filtered = filtered.filter(candidate => {
        const salary = parseSalary(candidate.salary);
        return salary <= parseInt(searchFilters.salaryMax);
      });
    }

    setDisplayedCandidates(filtered);
    setShowSearchPopup(false);
    
    // Reset selected skill view
    setSelectedSkill("All");
    setSkillStats(null);
  };

  // Reset search filters
  const resetSearchFilters = () => {
    setSearchFilters({
      skills: [],
      experienceMin: "",
      experienceMax: "",
      location: "",
      salaryMin: "",
      salaryMax: ""
    });
    setDisplayedCandidates(candidates);
    setShowSearchPopup(false);
    setSelectedSkill("All");
    setSkillStats(null);
  };

  // Handle search filter change
  const handleSearchFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle skill toggle in search filter
  const handleSearchSkillToggle = (skill) => {
    setSearchFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // Handle search input click
  const handleSearchClick = () => {
    setShowSearchPopup(true);
  };

  // Filter candidates by skill using the existing endpoint
  const filterCandidatesBySkill = async (skill) => {
    if (skill === "All") {
      setDisplayedCandidates(candidates);
      setSkillStats(null);
      setSelectedSkill("All");
      return;
    }

    try {
      setFilterLoading(true);
      const response = await axios.get(`http://localhost:5000/api/candidates/skill/${encodeURIComponent(skill)}`);
      
      if (response.data.success) {
        setDisplayedCandidates(response.data.data);
        setSkillStats({
          totalCount: response.data.count,
          skill: response.data.skill,
          relatedSkills: response.data.relatedSkills,
          summary: response.data.summary
        });
        setSelectedSkill(skill);
      }
    } catch (err) {
      console.error('Error filtering candidates:', err);
      setError(err.message);
    } finally {
      setFilterLoading(false);
    }
  };

  // Handle skill selection
  const handleSkillSelect = (skill) => {
    filterCandidatesBySkill(skill);
  };

  // Load data on component mount
  useEffect(() => {
    fetchAllCandidates();
    fetchSkillsData();
  }, []);

  // Filter candidates based on search term (client-side search within filtered results)
  const getSearchFilteredCandidates = () => {
    if (!searchTerm) return displayedCandidates;
    
    return displayedCandidates.filter(candidate => {
      return (
        candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.currentRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (candidate.skills || []).some(skill => 
          skill?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    });
  };

  const searchFilteredCandidates = getSearchFilteredCandidates();

  // Handle adding candidate to selection
  const handleSelectCandidate = (candidate) => {
    if (!selectedCandidates.some(c => c.id === candidate.id)) {
      setSelectedCandidates([...selectedCandidates, candidate]);
    }
  };

  // Handle removing candidate from selection
  const handleRemoveCandidate = (candidateId) => {
    setSelectedCandidates(selectedCandidates.filter(c => c.id !== candidateId));
  };

  // Handle sending email
  const handleSendEmail = (email) => {
    window.open(`mailto:${email}?subject=Job Opportunity`, '_blank');
  };

  // Handle sending WhatsApp
  const handleSendWhatsApp = (mobile) => {
    const message = "Hello, I came across your profile and wanted to discuss a job opportunity.";
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Handle adding a new skill from input
  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const newSkill = skillInput.trim();
      if (!newProfile.skills.includes(newSkill)) {
        setNewProfile(prev => ({
          ...prev,
          skills: [...prev.skills, newSkill]
        }));
        if (formErrors.skills) {
          setFormErrors(prev => ({ ...prev, skills: null }));
        }
      }
      setSkillInput("");
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skillToRemove) => {
    setNewProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Handle key press in skill input (add on Enter)
  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    
    if (!newProfile.name?.trim()) {
      errors.name = "Name is required";
    }
    
    if (!newProfile.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(newProfile.email)) {
      errors.email = "Email is invalid";
    }
    
    if (!newProfile.mobile?.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^[0-9+\-\s]{10,15}$/.test(newProfile.mobile)) {
      errors.mobile = "Mobile number is invalid";
    }
    
    if (newProfile.skills.length === 0) {
      errors.skills = "At least one skill is required";
    }
    
    return errors;
  };

  // Handle adding new profile
  const handleAddProfile = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormErrors({});
      
      const response = await axios.post('http://localhost:5000/api/candidates', newProfile);
      
      if (response.data.success) {
        setSuccessMessage("Profile added successfully!");
        
        await fetchAllCandidates();
        await fetchSkillsData();
        
        if (selectedSkill !== "All") {
          await filterCandidatesBySkill(selectedSkill);
        }
        
        setTimeout(() => {
          setShowAddProfile(false);
          setSuccessMessage("");
          setNewProfile({
            name: "",
            email: "",
            mobile: "",
            location: "",
            visaStatus: "",
            passport: "",
            experience: "",
            currentRole: "",
            skills: [],
            status: "Available",
            noticePeriod: "",
            salary: "",
            education: "",
            bio: ""
          });
          setSkillInput("");
        }, 1000);
      }
    } catch (err) {
      console.error('Error adding profile:', err);
      setFormErrors({
        submit: err.response?.data?.message || "Failed to add profile. Please try again."
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Handle skill selection for new profile from predefined list
  const handlePredefinedSkillToggle = (skill) => {
    setNewProfile(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
    if (formErrors.skills) {
      setFormErrors(prev => ({ ...prev, skills: null }));
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProfile(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  if (loading && candidates.length === 0) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="min-h-screen bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="min-h-screen bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="min-h-screen bg-white/50 backdrop-blur-sm">
        <Header />

        <div className="p-6 max-w-[95%] mx-auto">
          {/* TITLE AND CONTROLS */}
          <div className="flex justify-between mb-6 bg-white shadow-md rounded-2xl p-4">
            <div>
              <h2 className="text-3xl font-bold">Recruiter Dashboard</h2>
              <p className="text-gray-500">
                <span className="font-semibold">{totalSkills}</span> unique skills • 
                <span className="font-semibold ml-1">{candidates.length}</span> total candidates
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <button
                onClick={() => setShowAddProfile(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
              >
                <Plus size={18} />
                Add Profile
              </button>
              
              <button
                onClick={() => {
                  if (selectedCandidates.length === 0) {
                    alert("No candidates selected for export");
                    return;
                  }
                  const exportData = selectedCandidates.map(c => ({
                    Name: c.name,
                    Email: c.email,
                    Mobile: c.mobile,
                    Role: c.currentRole,
                    Skills: c.skills?.join(', '),
                    Status: c.status,
                    Salary: c.salary
                  }));
                  console.log("Exporting:", exportData);
                  alert(`Exporting ${selectedCandidates.length} candidates`);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
              >
                <Download size={18} />
                Export Selected ({selectedCandidates.length})
              </button>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Click to search & filter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={handleSearchClick}
                  className="pl-10 pr-4 py-2 border-2 border-blue-500 rounded-xl w-64 
                           focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
                           outline-none cursor-pointer"
                  readOnly
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchFilters.skills.length > 0 || searchFilters.experienceMin || searchFilters.experienceMax || searchFilters.location || searchFilters.salaryMin || searchFilters.salaryMax) && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-blue-700">Active Filters:</span>
                {searchFilters.skills.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Skills: {searchFilters.skills.join(', ')}
                  </span>
                )}
                {searchFilters.experienceMin && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Min Exp: {searchFilters.experienceMin} years
                  </span>
                )}
                {searchFilters.experienceMax && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Max Exp: {searchFilters.experienceMax} years
                  </span>
                )}
                {searchFilters.location && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Location: {searchFilters.location}
                  </span>
                )}
                {searchFilters.salaryMin && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Min Salary: ₹{searchFilters.salaryMin} LPA
                  </span>
                )}
                {searchFilters.salaryMax && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Max Salary: ₹{searchFilters.salaryMax} LPA
                  </span>
                )}
              </div>
              <button
                onClick={resetSearchFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT SIDEBAR - SKILLS WIDGET */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Skills Filter</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {totalSkills} skills
                    </span>
                    <Filter size={18} className="text-gray-500" />
                  </div>
                </div>
                
                <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                  <button
                    onClick={() => handleSkillSelect("All")}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                      selectedSkill === "All" 
                        ? "bg-blue-100 text-blue-700 border border-blue-300" 
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <span className="font-medium">All Skills</span>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {candidates.length}
                    </span>
                  </button>
                  
                  {skillGroups.map((group) => (
                    <button
                      key={group.skill}
                      onClick={() => handleSkillSelect(group.skill)}
                      disabled={filterLoading}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                        selectedSkill === group.skill
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "hover:bg-gray-100"
                      } ${filterLoading ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <span className="truncate">{group.skill}</span>
                      <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                        {group.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected Candidates Panel */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Selected Candidates</h4>
                    <Users size={16} className="text-gray-500" />
                  </div>
                  {selectedCandidates.length === 0 ? (
                    <p className="text-gray-500 text-sm">No candidates selected</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedCandidates.map(candidate => (
                        <div key={candidate.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{candidate.name}</p>
                            <p className="text-xs text-gray-500 truncate">{candidate.currentRole}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveCandidate(candidate.id)}
                            className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Loading indicator for filter */}
                {filterLoading && (
                  <div className="absolute inset-0 bg-white/50 rounded-2xl flex items-center justify-center">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>

            {/* MAIN CONTENT - CANDIDATES */}
            <div className="lg:col-span-3">
              {/* Candidates Grid */}
              <div className="bg-white rounded-2xl shadow-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {selectedSkill === "All" ? "All Candidates" : `${selectedSkill} Professionals`}
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      {searchTerm ? (
                        <>Showing {searchFilteredCandidates.length} of {displayedCandidates.length} (filtered by "{searchTerm}")</>
                      ) : (
                        <>{displayedCandidates.length} candidates</>
                      )}
                    </span>
                  </h3>
                </div>

                {searchFilteredCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No candidates found
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm 
                        ? `No results for "${searchTerm}"`
                        : "Try adjusting your filters"}
                    </p>
                    <button
                      onClick={resetSearchFilters}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchFilteredCandidates.map(candidate => (
                      <div key={candidate.id} className="border rounded-xl p-4 hover:shadow-lg transition-shadow">
                        {/* Candidate Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-lg truncate">{candidate.name}</h4>
                            <p className="text-gray-600 text-sm truncate">{candidate.currentRole}</p>
                          </div>
                          <button
                            onClick={() => handleSelectCandidate(candidate)}
                            disabled={selectedCandidates.some(c => c.id === candidate.id)}
                            className={`px-3 py-1 rounded text-sm ml-2 flex-shrink-0 ${
                              selectedCandidates.some(c => c.id === candidate.id)
                                ? "bg-green-100 text-green-800 cursor-default"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                          >
                            {selectedCandidates.some(c => c.id === candidate.id) ? "Selected" : "Select"}
                          </button>
                        </div>

                        {/* Candidate Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className="text-gray-500 flex-shrink-0" />
                            <span className="truncate">{candidate.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone size={14} className="text-gray-500 flex-shrink-0" />
                            <span>{candidate.mobile}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin size={14} className="text-gray-500 flex-shrink-0" />
                            <span className="truncate">{candidate.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase size={14} className="text-gray-500 flex-shrink-0" />
                            <span>Exp: {candidate.experience}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Shield size={14} className="text-gray-500 flex-shrink-0" />
                            <span>Visa: {candidate.visaStatus}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign size={14} className="text-gray-500 flex-shrink-0" />
                            <span>Salary: {candidate.salary}</span>
                          </div>
                        </div>

                        {/* Skills */}
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {(candidate.skills || []).map(skill => (
                              <button
                                key={skill}
                                onClick={() => handleSkillSelect(skill)}
                                className={`px-2 py-1 text-xs rounded transition-colors ${
                                  skill === selectedSkill
                                    ? "bg-green-500 text-white font-bold hover:bg-green-600"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                }`}
                              >
                                {skill}
                                {skill === selectedSkill && " ✓"}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendEmail(candidate.email)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                          >
                            <Mail size={16} />
                            Email
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(candidate.mobile)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 rounded-lg text-sm"
                          >
                            <MessageSquare size={16} />
                            WhatsApp
                          </button>
                          <button
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm"
                            onClick={() => {
                              alert(`Name: ${candidate.name}\nRole: ${candidate.currentRole}\nExperience: ${candidate.experience}\nEducation: ${candidate.education}\nSalary: ${candidate.salary}\nVisa: ${candidate.visaStatus}\n\nBio: ${candidate.bio}`);
                            }}
                          >
                            <FileText size={16} />
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH FILTER POPUP */}
        {showSearchPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Search Filters</h3>
                    <p className="text-gray-500 text-sm">Filter candidates by multiple criteria</p>
                  </div>
                  <button
                    onClick={() => setShowSearchPopup(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Skills Filter - Multiple Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Skills (select multiple)</label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {skillGroups.map(group => (
                          <button
                            key={group.skill}
                            type="button"
                            onClick={() => handleSearchSkillToggle(group.skill)}
                            className={`px-3 py-1 rounded-full text-sm transition ${
                              searchFilters.skills.includes(group.skill)
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                          >
                            {group.skill} ({group.count})
                          </button>
                        ))}
                      </div>
                    </div>
                    {searchFilters.skills.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Selected: {searchFilters.skills.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Experience Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience (years)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          name="experienceMin"
                          value={searchFilters.experienceMin}
                          onChange={handleSearchFilterChange}
                          placeholder="Min"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          name="experienceMax"
                          value={searchFilters.experienceMax}
                          onChange={handleSearchFilterChange}
                          placeholder="Max"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Salary (LPA)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          name="salaryMin"
                          value={searchFilters.salaryMin}
                          onChange={handleSearchFilterChange}
                          placeholder="Min LPA"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          name="salaryMax"
                          value={searchFilters.salaryMax}
                          onChange={handleSearchFilterChange}
                          placeholder="Max LPA"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <select
                      name="location"
                      value={searchFilters.location}
                      onChange={handleSearchFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Locations</option>
                      {availableLocations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Stats */}
                <div className="mt-4 text-sm text-gray-500 text-center">
                  {candidates.filter(c => {
                    let match = true;
                    
                    // Skills filter
                    if (searchFilters.skills.length > 0) {
                      match = match && searchFilters.skills.some(skill => 
                        c.skills && c.skills.includes(skill)
                      );
                    }
                    
                    // Experience min filter
                    if (searchFilters.experienceMin && searchFilters.experienceMin !== "") {
                      const exp = parseInt(c.experience) || 0;
                      match = match && exp >= parseInt(searchFilters.experienceMin);
                    }
                    
                    // Experience max filter
                    if (searchFilters.experienceMax && searchFilters.experienceMax !== "") {
                      const exp = parseInt(c.experience) || 0;
                      match = match && exp <= parseInt(searchFilters.experienceMax);
                    }
                    
                    // Salary min filter
                    if (searchFilters.salaryMin && searchFilters.salaryMin !== "") {
                      const salary = parseSalary(c.salary);
                      match = match && salary >= parseInt(searchFilters.salaryMin);
                    }
                    
                    // Salary max filter
                    if (searchFilters.salaryMax && searchFilters.salaryMax !== "") {
                      const salary = parseSalary(c.salary);
                      match = match && salary <= parseInt(searchFilters.salaryMax);
                    }
                    
                    // Location filter
                    if (searchFilters.location && searchFilters.location !== "") {
                      if (!c.location) {
                        match = false;
                      } else {
                        const city = c.location.split(',')[0].trim();
                        match = match && city.toLowerCase() === searchFilters.location.toLowerCase();
                      }
                    }
                    
                    return match;
                  }).length} candidates match
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilters({
                        skills: [],
                        experienceMin: "",
                        experienceMax: "",
                        location: "",
                        salaryMin: "",
                        salaryMax: ""
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={applySearchFilters}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD PROFILE MODAL */}
        {showAddProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Add New Candidate Profile</h3>
                    <p className="text-gray-500 text-sm">Fill in the details to add a new candidate</p>
                  </div>
                  <button
                    onClick={() => setShowAddProfile(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    {successMessage}
                  </div>
                )}

                {/* Form Error */}
                {formErrors.submit && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {formErrors.submit}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleAddProfile(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="name"
                            value={newProfile.name}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formErrors.name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter full name"
                          />
                        </div>
                        {formErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="email"
                            name="email"
                            value={newProfile.email}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formErrors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter email address"
                          />
                        </div>
                        {formErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Mobile <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="tel"
                            name="mobile"
                            value={newProfile.mobile}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter mobile number"
                          />
                        </div>
                        {formErrors.mobile && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="location"
                            value={newProfile.location}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Bangalore, India"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Visa Status</label>
                        <select
                          name="visaStatus"
                          value={newProfile.visaStatus}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Visa Status</option>
                          <option value="Not Required">Not Required</option>
                          <option value="H1B (USA)">H1B (USA)</option>
                          <option value="L1 (USA)">L1 (USA)</option>
                          <option value="Work Permit (UK)">Work Permit (UK)</option>
                          <option value="EU Blue Card">EU Blue Card</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Education</label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="education"
                            value={newProfile.education}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., B.Tech in CS"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Passport Details</label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="passport"
                            value={newProfile.passport}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Valid until 2030"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Experience</label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="experience"
                            value={newProfile.experience}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 5 years"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Current Role</label>
                        <input
                          type="text"
                          name="currentRole"
                          value={newProfile.currentRole}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Senior Developer"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Expected Salary</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          <input
                            type="text"
                            name="salary"
                            value={newProfile.salary}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., ₹18 LPA"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Notice Period</label>
                        <select
                          name="noticePeriod"
                          value={newProfile.noticePeriod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Notice Period</option>
                          <option value="Immediate">Immediate</option>
                          <option value="15 days">15 days</option>
                          <option value="30 days">30 days</option>
                          <option value="45 days">45 days</option>
                          <option value="60 days">60 days</option>
                          <option value="90 days">90 days</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                          name="status"
                          value={newProfile.status}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Available">Available</option>
                          <option value="Not Available">Not Available</option>
                          <option value="Interviewing">Interviewing</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Skills Selection */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">
                      Skills <span className="text-red-500">*</span>
                    </label>
                    
                    {/* Manual Skill Input */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Add skills manually:</p>
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={handleSkillKeyPress}
                            placeholder="Type a skill and press Enter"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          disabled={!skillInput.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <PlusCircle size={18} />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Selected Skills Display */}
                    {newProfile.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Selected skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {newProfile.skills.map((skill) => (
                            <div
                              key={skill}
                              className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(skill)}
                                className="hover:text-red-500 transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Predefined Skills from Database */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Or select from existing skills:</p>
                      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-32 overflow-y-auto">
                        {skillGroups.length > 0 ? (
                          skillGroups.map((group) => (
                            <button
                              key={group.skill}
                              type="button"
                              onClick={() => handlePredefinedSkillToggle(group.skill)}
                              className={`px-3 py-1 rounded-full text-sm transition ${
                                newProfile.skills.includes(group.skill)
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {group.skill}
                              {newProfile.skills.includes(group.skill) && " ✓"}
                            </button>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No skills available</p>
                        )}
                      </div>
                    </div>

                    {/* Skills Error */}
                    {formErrors.skills && (
                      <p className="text-red-500 text-xs mt-2">{formErrors.skills}</p>
                    )}
                    
                    {/* Skills Count */}
                    <p className="text-sm text-gray-500 mt-2">
                      Total skills selected: {newProfile.skills.length}
                    </p>
                  </div>

                  {/* Bio */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Bio/Summary</label>
                    <textarea
                      name="bio"
                      value={newProfile.bio}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter candidate bio/summary..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end mt-8">
                    <button
                      type="button"
                      onClick={() => setShowAddProfile(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                      disabled={submitLoading}
                    >
                      <X size={18} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitLoading ? (
                        <>
                          <Loader size={18} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recruiter;