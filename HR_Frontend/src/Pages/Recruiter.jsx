import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import { useLocation } from "react-router-dom";
import bgImage from "../assets/Images/back.png";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Mail, 
  Phone, 
  Briefcase, 
  FileText,
  XCircle,
  Plus,
  Filter,
  Loader,
  Users,
  User,
  Save,
  X,
  CheckCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload,
  Trash2,
  Edit2,
  Code,
  Pencil,
  Building2,
  Award,
  Clock,
  UserCircle,
  FileCheck,
  CalendarDays,
  IdCard,
  Globe,
  MessageCircle
} from "lucide-react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Recruiter = ({ user }) => {


  // Add this with other states
const [candidateInProgress, setCandidateInProgress] = useState({});
  const [searchParams] = useSearchParams(); // Add this hook
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSelectedView, setShowSelectedView] = useState(false);
  const [candidateClientStatus, setCandidateClientStatus] = useState({});
  const [pdfFile, setPdfFile] = useState(null);
  const navigate = useNavigate();
  // Get user role from props
  const userRole = user?.role || "recruiter";
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    experience: "",
    currentOrg: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriod: "",
    profileSourcedBy: "",
    clientName: "",
    profileSubmissionDate: "",
    keySkills: [],
    visaType: "NA",
    resumePdf: null
  });
  const [editSkillInput, setEditSkillInput] = useState("");
  // State for visa types
const [visaTypes, setVisaTypes] = useState([]);
const [visaTypesLoading, setVisaTypesLoading] = useState(false);
  const [editPdfFile, setEditPdfFile] = useState(null);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCandidateId, setDeletingCandidateId] = useState(null);
  const [deletingCandidateName, setDeletingCandidateName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedViewPage, setSelectedViewPage] = useState(1);
  const [itemsPerPage] = useState(4);
  
  // State for API data
  const [candidates, setCandidates] = useState([]);
  const [displayedCandidates, setDisplayedCandidates] = useState([]);
  
  // State for skills from API
  const [skills, setSkills] = useState([]);
  const [skillCounts, setSkillCounts] = useState({});
  const [totalSkills, setTotalSkills] = useState(0);
  const [skillsLoading, setSkillsLoading] = useState(false);
  
  // Search filter state
  const [searchFilters, setSearchFilters] = useState({
    primarySkills: [],
    secondarySkills: [],
    experienceMin: "",
    experienceMax: "",
    location: ""
  });

  // Skill suggestions state
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  
  // Search popup skill suggestions
  const [showPrimarySuggestions, setShowPrimarySuggestions] = useState(false);
  const [showSecondarySuggestions, setShowSecondarySuggestions] = useState(false);
  const [filteredPrimarySuggestions, setFilteredPrimarySuggestions] = useState([]);
  const [filteredSecondarySuggestions, setFilteredSecondarySuggestions] = useState([]);
  
  // Add profile skill suggestions
  const [showAddSkillSuggestions, setShowAddSkillSuggestions] = useState(false);
  const [filteredAddSkillSuggestions, setFilteredAddSkillSuggestions] = useState([]);
  
  // Edit profile skill suggestions
  const [showEditSkillSuggestions, setShowEditSkillSuggestions] = useState(false);
  const [filteredEditSkillSuggestions, setFilteredEditSkillSuggestions] = useState([]);
  
  // Date picker state
  const [profileSubmissionDate, setProfileSubmissionDate] = useState(null);
  const [editProfileSubmissionDate, setEditProfileSubmissionDate] = useState(null);
  
  // Form state for new profile
  const [newProfile, setNewProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    experience: "",
    currentOrg: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriod: "",
    profileSourcedBy: "",
    clientName: "",
    profileSubmissionDate: "",
    keySkills: [],
    visaType: "NA",
    resumePdf: null
  });

  // Skill input state
  const [skillInput, setSkillInput] = useState("");
  const [primarySkillInput, setPrimarySkillInput] = useState("");
  const [secondarySkillInput, setSecondarySkillInput] = useState("");
  
  // Track selected suggestion index for keyboard navigation
  const [selectedPrimarySuggestionIndex, setSelectedPrimarySuggestionIndex] = useState(0);
  const [selectedSecondarySuggestionIndex, setSelectedSecondarySuggestionIndex] = useState(0);
  const [selectedAddSkillSuggestionIndex, setSelectedAddSkillSuggestionIndex] = useState(0);
  const [selectedEditSkillSuggestionIndex, setSelectedEditSkillSuggestionIndex] = useState(0);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

const parseKeySkills = (skills) => {
  if (!skills) return [];

  // Already array
  if (Array.isArray(skills)) {
    return skills.filter(s => s && s.trim());
  }

  // String case
  if (typeof skills === 'string') {
    // Try to parse JSON string first
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) {
        return parsed.filter(s => s && s.trim());
      }
      if (typeof parsed === 'string') {
        return [parsed.trim()];
      }
    } catch (e) {
      // Not JSON, check for commas
    }
    
    // Check if it contains commas (multiple skills)
    if (skills.includes(',')) {
      return skills.split(',').map(s => s.trim()).filter(s => s);
    }
    
    // Single skill
    const trimmed = skills.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

  // Function to fetch candidate's status for current client
const fetchCandidateStatusForClient = async (candidateId, clientName) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/candidates/${candidateId}/status-for-client/${encodeURIComponent(clientName)}`
    );
    return response.data.data;
  } catch (err) {
    console.error(`Error fetching status for candidate ${candidateId} client ${clientName}:`, err);
    return null;
  }
};

const processCandidate = (candidate) => {
  if (!candidate) return null;
  
  console.log("=== PROCESS CANDIDATE DEBUG ===");
  console.log("Input candidate:", candidate);
  console.log("Candidate.Can_ID:", candidate.Can_ID);
  console.log("Candidate.canId:", candidate.canId);
  console.log("Candidate.id:", candidate.id);
  
  // Get the actual Can_ID from the database
  const actualCanId = candidate.Can_ID || candidate.canId;
  
  console.log("Extracted actualCanId:", actualCanId);
  
  // Enhanced skill parsing
  const getSkills = () => {
    const skillsSource = candidate['Key Skills'] || 
                         candidate.keySkills || 
                         candidate.skills || 
                         candidate['key_skills'] || 
                         [];
    
    if (Array.isArray(skillsSource)) {
      return skillsSource.filter(s => s && s.trim());
    }
    
    if (typeof skillsSource === 'string') {
      try {
        const parsed = JSON.parse(skillsSource);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => s && s.trim());
        }
        if (typeof parsed === 'string') {
          return parsed.split(',').map(s => s.trim()).filter(s => s);
        }
      } catch (e) {
        return skillsSource.split(',').map(s => s.trim()).filter(s => s);
      }
    }
    
    if (typeof skillsSource === 'object' && skillsSource !== null) {
      if (skillsSource.low !== undefined || Array.isArray(skillsSource)) {
        return Object.values(skillsSource).filter(s => s && s.trim && s.trim());
      }
      if (Object.keys(skillsSource).length > 0) {
        if (skillsSource.skills) {
          return getSkills(skillsSource.skills);
        }
        return Object.values(skillsSource).filter(s => s && typeof s === 'string');
      }
    }
    
    return [];
  };
  
  const keySkills = getSkills();
  
  // CRITICAL: Use actualCanId for the numeric ID, NOT the temporary id
  const numericId = actualCanId ? Number(actualCanId) : null;
  
  const processed = {
    canId: numericId,
    actualId: numericId,
    id: numericId, // Use numeric ID, not temporary
    name: candidate['Candidate Name'] || candidate.name || '',
    email: candidate.Email || candidate.email || '',
    mobile: candidate['Mobile No'] || candidate.mobile || '',
    experience: candidate.Experience || candidate.experience || '',
    currentOrg: candidate['Current Org'] || candidate.currentOrg || '',
    currentCTC: candidate['Current CTC'] || candidate.currentCTC || '',
    expectedCTC: candidate['Expected CTC'] || candidate.expectedCTC || '',
    noticePeriod: candidate['Notice Period in days'] || candidate.noticePeriod || '',
    profileSourcedBy: candidate['Profiles sourced by'] || candidate.profileSourcedBy || '',
    clientName: candidate['Client Name'] || candidate.clientName || '',
    profileSubmissionDate: candidate['Profile submission date'] || candidate.profileSubmissionDate || '',
    visaType: candidate['Visa type'] || candidate.visaType || 'NA',
    resumePath: candidate.resumePath || '',
    googleDriveFileId: candidate.googleDriveFileId || '',
    googleDriveViewLink: candidate.googleDriveViewLink || '',
    googleDriveDownloadLink: candidate.googleDriveDownloadLink || '',
    keySkills: keySkills
  };
  
  console.log("Processed candidate with ID:", processed.id, "type:", typeof processed.id);
  console.log("=====================================");
  
  processed.experienceNum = parseFloat(processed.experience) || 0;
  
  return processed;
};

  // Update skill counts based on candidates
  const updateSkillCounts = (candidatesList) => {
    if (Object.keys(skillCounts).length > 0) {
      return;
    }
    
    const counts = {};
    
    skills.forEach(skill => {
      counts[skill.name] = 0;
    });
    
    candidatesList.forEach(candidate => {
      if (candidate.keySkills && Array.isArray(candidate.keySkills)) {
        candidate.keySkills.forEach(skill => {
          if (skill && typeof skill === 'string') {
            const trimmedSkill = skill.trim();
            if (trimmedSkill) {
              const matchingSkill = skills.find(s => 
                s.name.toLowerCase() === trimmedSkill.toLowerCase()
              );
              
              if (matchingSkill) {
                counts[matchingSkill.name] = (counts[matchingSkill.name] || 0) + 1;
              } else {
                counts[trimmedSkill] = (counts[trimmedSkill] || 0) + 1;
              }
            }
          }
        });
      }
    });
    
    setSkillCounts(counts);
  };

  // Add this function near the top of your Recruiter component, after all the useState declarations
const validateMobileNumber = (value) => {
  // Remove all non-digit characters temporarily for validation
  const digitsOnly = value.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  if (digitsOnly.length === 10) {
    return { isValid: true, formattedValue: digitsOnly };
  }
  
  // If it's less than 10 digits, allow typing but show error
  if (digitsOnly.length > 0 && digitsOnly.length < 10) {
    return { isValid: false, formattedValue: digitsOnly, error: `Mobile number must be exactly 10 digits (currently ${digitsOnly.length})` };
  }
  
  // If it's more than 10 digits, prevent further typing
  if (digitsOnly.length > 10) {
    return { isValid: false, formattedValue: digitsOnly.slice(0, 10), error: "Mobile number cannot exceed 10 digits" };
  }
  
  return { isValid: true, formattedValue: value, error: null };
};


// Fetch visa types from backend
const fetchVisaTypes = async () => {
  try {
    setVisaTypesLoading(true);
    const response = await axios.get('http://localhost:5000/api/visa');
    
    // Your API returns data directly, not wrapped in {success, data}
    if (response.data && Array.isArray(response.data)) {
      // Extract just the visa type names from the response
      const visaTypeNames = response.data.map(item => item.VisaType);
      setVisaTypes(visaTypeNames);
      console.log('Fetched visa types:', visaTypeNames);
    } else {
      // Fallback to default visa types
      console.warn('Visa API returned unexpected format, using defaults');
      setVisaTypes(['NA', 'H1B', 'L1', 'Green Card', 'Citizen', 'Other']);
    }
  } catch (err) {
    console.error('Error fetching visa types:', err);
    // Fallback to default visa types
    setVisaTypes(['NA', 'H1B', 'L1', 'Green Card', 'Citizen', 'Other']);
  } finally {
    setVisaTypesLoading(false);
  }
};
// Handle mobile input change with validation
const handleMobileChange = (e, setterFunction, errorSetterFunction) => {
  let value = e.target.value;
  
  // Remove any non-digit characters
  const digitsOnly = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limitedDigits = digitsOnly.slice(0, 10);
  
  // Format with spaces for better readability (optional)
  let formattedValue = limitedDigits;
  if (limitedDigits.length >= 5) {
    formattedValue = limitedDigits.slice(0, 5) + ' ' + limitedDigits.slice(5);
  }
  
  // Update the form field
  setterFunction(formattedValue);
  
  // Validate
  if (limitedDigits.length === 10) {
    errorSetterFunction(null);
  } else if (limitedDigits.length > 0 && limitedDigits.length < 10) {
    errorSetterFunction(`Mobile number must be exactly 10 digits (currently ${limitedDigits.length})`);
  } else if (limitedDigits.length > 10) {
    errorSetterFunction("Mobile number cannot exceed 10 digits");
  } else {
    errorSetterFunction(null);
  }
};
// Handle adding skill to candidate profile (for Add Profile Modal)
const handleAddSkillToProfile = (skillToAdd = null) => {
  // If skillToAdd is provided (from suggestion), use it
  // Otherwise, use the skillInput value
  let skill = skillToAdd || skillInput.trim();
  
  if (!skill) return;
  
  // Don't split by comma - treat the entire input as ONE skill
  const skillExists = skillSuggestions.some(
    existingSkill => existingSkill.toLowerCase() === skill.toLowerCase()
  );
  
  if (skillExists) {
    // Check if skill already added
    if (!newProfile.keySkills.includes(skill)) {
      setNewProfile(prev => ({
        ...prev,
        keySkills: [...prev.keySkills, skill]  // Add as separate skill
      }));
      console.log(`✅ Added skill: ${skill}`);
    } else {
      alert(`"${skill}" is already added`);
      return;
    }
    
    // Clear errors if any
    if (formErrors.keySkills) {
      setFormErrors(prev => ({ ...prev, keySkills: null }));
    }
    
    // Clear input and close suggestions
    setSkillInput("");
    setShowAddSkillSuggestions(false);
    setSelectedAddSkillSuggestionIndex(0);
  } else {
    alert(`"${skill}" is not in the skills database. Please select from the suggestions.`);
    setShowAddSkillSuggestions(false);
    setSelectedAddSkillSuggestionIndex(0);
  }
};
// Add this function in Recruiter component
const handleSubmitSelectedCandidates = async () => {
  if (selectedCandidates.length === 0) {
    alert("Please select at least one candidate");
    return;
  }

  try {
    setSubmitLoading(true);
    
    // Get demandId from URL params
    const demandId = searchParams.get('demandId');
    
    if (!demandId) {
      alert("Demand ID not found");
      return;
    }
    
    // Log the selected candidates to verify Can_IDs
    console.log("Selected candidates with Can_IDs:", selectedCandidates.map(c => ({
      name: c.name,
      canId: c.canId,
      id: c.id
    })));
    
    // Prepare selected candidates data
    const selectedData = {
      candidates: selectedCandidates.map(c => ({
        canId: c.canId || c.actualId || c.id, // Use canId as primary
        name: c.name,
        email: c.email,
        mobile: c.mobile,
        experience: c.experience,
        currentOrg: c.currentOrg,
        currentCTC: c.currentCTC,
        expectedCTC: c.expectedCTC,
        noticePeriod: c.noticePeriod,
        profileSourcedBy: c.profileSourcedBy,
        clientName: c.clientName,
        profileSubmissionDate: c.profileSubmissionDate,
        visaType: c.visaType,
        resumePath: c.resumePath,
        googleDriveViewLink: c.googleDriveViewLink,
        keySkills: c.keySkills,
        selectedAt: new Date().toISOString(),
        status: 'Selected'
      })),
      selectedBy: user?.name || user?.email || 'Unknown'
    };
    
    console.log(`Saving ${selectedCandidates.length} candidates for demand ${demandId}`);
    console.log("Selected data being sent:", selectedData);
    
    // Save to backend
    const response = await axios.post(
      `http://localhost:5000/api/selected-candidates/${demandId}`,
      selectedData
    );
    
    if (response.data.success) {
      setSuccessMessage(`Successfully saved ${selectedCandidates.length} candidates!`);
      
      // Clear selected candidates after successful save
      setSelectedCandidates([]);
      
      // Optionally, navigate back to demand after short delay
      setTimeout(() => {
        window.location.href = '/demand';
      }, 2000);
    }
    
  } catch (err) {
    console.error('Error saving selected candidates:', err);
    setError(err.response?.data?.message || "Failed to save selected candidates");
  } finally {
    setSubmitLoading(false);
  }
};



// Inside the Recruiter component, add:
const location = useLocation();



// Add this useEffect to handle URL parameters
useEffect(() => {
  const applyFiltersFromUrl = async () => {
    const params = new URLSearchParams(location.search);
    
    // Check if we should auto-apply filters
    if (params.get('autoFilter') === 'true') {
      const primarySkills = params.get('primarySkills')?.split(',').filter(s => s) || [];
      const secondarySkills = params.get('secondarySkills')?.split(',').filter(s => s) || [];
      const minExperience = params.get('minExperience');
      const maxExperience = params.get('maxExperience');
      
      // Set the search filters state
      setSearchFilters({
        primarySkills: primarySkills,
        secondarySkills: secondarySkills,
        experienceMin: minExperience || "",
        experienceMax: maxExperience || "",
        location: ""
      });
      
      // Set the input fields for display
      setPrimarySkillInput(primarySkills.join(', '));
      setSecondarySkillInput(secondarySkills.join(', '));
      
      // Apply the filters automatically
      try {
        setFilterLoading(true);
        
        // Build the API request
        const apiParams = new URLSearchParams();
        
        if (primarySkills.length > 0) {
          apiParams.append('primarySkills', primarySkills.join(','));
        }
        
        if (secondarySkills.length > 0) {
          apiParams.append('secondarySkills', secondarySkills.join(','));
        }
        
        if (minExperience) {
          apiParams.append('minExperience', minExperience);
        }
        
        if (maxExperience) {
          apiParams.append('maxExperience', maxExperience);
        }
        
        console.log("Auto-applying filters from demand:", apiParams.toString());
        
        const response = await axios.get(`http://localhost:5000/api/shortcandidates/filter?${apiParams.toString()}`);
        
        if (response.data.success) {
          const processedCandidates = response.data.data
            .map(processCandidate)
            .filter(c => c !== null);
          
          console.log(`Found ${processedCandidates.length} candidates matching demand requirements`);
          setDisplayedCandidates(processedCandidates);
          setCurrentPage(1);
          setSelectedSkill("All");
          setSearchTerm("");
        }
      } catch (err) {
        console.error('Error auto-applying filters:', err);
        setError(err.message || "Failed to filter candidates");
      } finally {
        setFilterLoading(false);
      }
    }
  };
  
  if (candidates.length > 0) {
    applyFiltersFromUrl();
  }
}, [location.search, candidates.length]); // Re-run when URL changes or candidates load
const fetchSkillsData = async () => {
  try {
    setSkillsLoading(true);
    const response = await axios.get('http://localhost:5000/api/skillsmatch/skills');
    console.log("Skills API response:", response.data);
    
    if (response.data.success && response.data.data) {
      let skillsList = response.data.data;
      console.log(`Fetched ${skillsList.length} skills from API:`, skillsList);
      
      // Sort skills by count in descending order (highest first)
      skillsList.sort((a, b) => {
        // First sort by count (descending)
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort alphabetically
        return a.name.localeCompare(b.name);
      });
      
      console.log("Sorted skills by count:", skillsList);
      
      setSkills(skillsList);
      setTotalSkills(response.data.totalSkills || skillsList.length);
      
      const countsFromApi = {};
      skillsList.forEach(skill => {
        countsFromApi[skill.name] = skill.count || 0;
      });
      
      setSkillCounts(countsFromApi);
      
      const allSkills = skillsList.map(item => item.name);
      setSkillSuggestions(allSkills.sort()); // Keep suggestions alphabetically
      
    } else {
      console.log("Skills API returned no data");
      setSkills([]);
      setTotalSkills(0);
      setSkillSuggestions([]);
      setSkillCounts({});
    }
  } catch (err) {
    console.error('Error fetching skills data:', err);
    setSkills([]);
    setTotalSkills(0);
    setSkillSuggestions([]);
    setSkillCounts({});
  } finally {
    setSkillsLoading(false);
  }
};
  useEffect(() => {
const autoFilterFromDemand = async () => {
  // Check if we should auto-apply filters
  if (searchParams.get('autoFilter') === 'true') {
    const primarySkills = searchParams.get('primarySkills')?.split(',').filter(s => s) || [];
    const secondarySkills = searchParams.get('secondarySkills')?.split(',').filter(s => s) || [];
    const minExperience = searchParams.get('minExperience');
    const maxExperience = searchParams.get('maxExperience');
    const demandId = searchParams.get('demandId');
    const clientName = searchParams.get('clientName'); // ← ADD THIS LINE
    
    console.log(`🔍 Auto-filtering for demand ID: ${demandId}`);
    console.log('Client name for Zone filtering:', clientName); // ← ADD THIS LOG
    console.log('Primary skills:', primarySkills);
    console.log('Secondary skills:', secondarySkills);
    console.log('Experience range:', minExperience, '-', maxExperience);
    
    // Set the search filters state
    setSearchFilters({
      primarySkills: primarySkills,
      secondarySkills: secondarySkills,
      experienceMin: minExperience || "",
      experienceMax: maxExperience || "",
      location: ""
    });
    
    // Set the input fields for display
    setPrimarySkillInput(primarySkills.join(', '));
    setSecondarySkillInput(secondarySkills.join(', '));
    
    // Apply the filters
    try {
      setFilterLoading(true);
      
      // Build the API request
      const params = new URLSearchParams();
      
      if (primarySkills.length > 0) {
        params.append('primarySkills', primarySkills.join(','));
      }
      
      if (secondarySkills.length > 0) {
        params.append('secondarySkills', secondarySkills.join(','));
      }
      
      if (minExperience) {
        params.append('minExperience', minExperience);
      }
      
      if (maxExperience) {
        params.append('maxExperience', maxExperience);
      }
      
      // ✅ ADD THIS - Pass clientName for Zone filtering
      if (clientName) {
        params.append('clientName', clientName);
        console.log(`🚫 Filtering out candidates in Zone for client: ${clientName}`);
      }
      
      console.log("Calling filter API with:", params.toString());
      
      const response = await axios.get(`http://localhost:5000/api/shortcandidates/filter?${params.toString()}`);
      
      if (response.data.success) {
        console.log(`✅ API response: Excluded ${response.data.excludedZoneCount || 0} candidates from Zone`);
        
        const processedCandidates = response.data.data
          .map(processCandidate)
          .filter(c => c !== null);
        
        console.log(`✅ Found ${processedCandidates.length} candidates matching demand requirements`);
        setDisplayedCandidates(processedCandidates);
        setCurrentPage(1);
        setSelectedSkill("All");
        setSearchTerm("");
        
        // Show success message with excluded count
        if (response.data.excludedZoneCount > 0) {
          setSuccessMessage(`Found ${processedCandidates.length} candidates (${response.data.excludedZoneCount} excluded from Zone)`);
          setTimeout(() => setSuccessMessage(""), 3000);
        } else {
          setSuccessMessage(`Found ${processedCandidates.length} candidates matching this demand`);
          setTimeout(() => setSuccessMessage(""), 3000);
        }
      }
    } catch (err) {
      console.error('❌ Error auto-applying filters:', err);
      setError("Failed to filter candidates for this demand");
    } finally {
      setFilterLoading(false);
    }
  }
};
    
    // Only run if candidates are loaded
    if (candidates.length > 0) {
      autoFilterFromDemand();
    }
  }, [searchParams, candidates.length]); 
  // Fetch all candidates
const fetchAllCandidates = async () => {
  try {
    setLoading(true);
    setError(null);
    const response = await axios.get('http://localhost:5000/api/candidates/all');
    console.log("=== BACKEND RESPONSE ===");
    console.log("First candidate from backend:", response.data.data?.[0]);
    console.log("First candidate Can_ID:", response.data.data?.[0]?.Can_ID);
    console.log("First candidate canId:", response.data.data?.[0]?.canId);
    console.log("First candidate id:", response.data.data?.[0]?.id);
    
    if (response.data.success) {
      const processedCandidates = response.data.data
        .map(processCandidate)
        .filter(c => c !== null);
      
      console.log("Processed first candidate:", processedCandidates[0]);
      console.log("Processed first candidate ID:", processedCandidates[0]?.id);
      
      processedCandidates.sort((a, b) => {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idB - idA;
      });
      
      console.log(`Processed ${processedCandidates.length} candidates`);
      
      setCandidates(processedCandidates);
      setDisplayedCandidates(processedCandidates);
      setCurrentPage(1);
      
      if (skills.length > 0) {
        updateSkillCounts(processedCandidates);
      }
    } else {
      setError("Failed to fetch candidates: " + (response.data.message || "Unknown error"));
    }
  } catch (err) {
    console.error('Error fetching candidates:', err);
    setError(err.message || "Failed to connect to server");
  } finally {
    setLoading(false);
  }
};

  // Check if email exists (excluding current candidate)
  const checkEmailExists = async (email, excludeId = null) => {
    try {
      const url = `http://localhost:5000/api/candidates/check-email/${encodeURIComponent(email)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
      const response = await axios.get(url);
      return response.data.exists;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  // Check if mobile exists (excluding current candidate)
  const checkMobileExists = async (mobile, excludeId = null) => {
    try {
      const cleanMobile = mobile.replace(/\D/g, '');
      const url = `http://localhost:5000/api/candidates/check-mobile/${encodeURIComponent(cleanMobile)}${excludeId ? `?excludeId=${excludeId}` : ''}`;
      const response = await axios.get(url);
      return response.data.exists;
    } catch (err) {
      console.error('Error checking mobile:', err);
      return false;
    }
  };

  // Handle viewing candidate details
  const handleViewDetails = (candidate, e) => {
    if (e) {
      e.stopPropagation();
    }
    console.log("Viewing candidate:", candidate);
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  // Handle viewing resume
  const handleViewResume = (candidate, e) => {
    e.stopPropagation();
    
    console.log("Viewing resume for candidate:", candidate);
    
    if (candidate.googleDriveViewLink) {
      console.log("Opening Google Drive resume:", candidate.googleDriveViewLink);
      setSelectedResumeUrl(candidate.googleDriveViewLink);
      setShowResumeModal(true);
    }
    else if (candidate.resumePath) {
      const resumeUrl = candidate.resumePath.startsWith('http') 
        ? candidate.resumePath 
        : `http://localhost:5000${candidate.resumePath}`;
      
      console.log("Opening local resume:", resumeUrl);
      setSelectedResumeUrl(resumeUrl);
      setShowResumeModal(true);
    }
    else {
      alert('No resume uploaded for this candidate');
    }
  };

const handleEditClick = (candidate, e) => {
  e.stopPropagation();
  
  console.log("=== EDIT CLICK DEBUG - FULL CANDIDATE OBJECT ===");
  console.log(JSON.stringify(candidate, null, 2));
  console.log("All keys in candidate:", Object.keys(candidate));
  console.log("candidate.id:", candidate.id, "type:", typeof candidate.id);
  console.log("candidate.canId:", candidate.canId, "type:", typeof candidate.canId);
  console.log("candidate.actualId:", candidate.actualId, "type:", typeof candidate.actualId);
  console.log("candidate.Can_ID:", candidate.Can_ID, "type:", typeof candidate.Can_ID);
  
  // Try to find ANY numeric ID in the candidate object
  let actualDbId = null;
  
  // Check all possible ID fields
  if (candidate.Can_ID && typeof candidate.Can_ID === 'number') {
    actualDbId = candidate.Can_ID;
    console.log("Found ID in Can_ID:", actualDbId);
  } else if (candidate.canId && typeof candidate.canId === 'number') {
    actualDbId = candidate.canId;
    console.log("Found ID in canId:", actualDbId);
  } else if (candidate.actualId && typeof candidate.actualId === 'number') {
    actualDbId = candidate.actualId;
    console.log("Found ID in actualId:", actualDbId);
  } else if (candidate.id && typeof candidate.id === 'number') {
    actualDbId = candidate.id;
    console.log("Found ID in id:", actualDbId);
  }
  
  // If still no ID, check if any field contains a number that's not a temp ID
  if (!actualDbId) {
    for (const key of Object.keys(candidate)) {
      const value = candidate[key];
      if (typeof value === 'number' && value > 0 && value < 10000) {
        actualDbId = value;
        console.log(`Found numeric ID in field "${key}":`, actualDbId);
        break;
      }
    }
  }
  
  console.log("Final actualDbId:", actualDbId);
  
  if (!actualDbId) {
    console.error("No valid ID found in candidate object!");
    alert("Cannot edit this candidate. The candidate ID is missing. Please refresh the page.");
    return;
  }
  
  // Convert to number if it's a string number
  if (typeof actualDbId === 'string' && !isNaN(actualDbId)) {
    actualDbId = parseInt(actualDbId);
  }
  
  // Create a clean candidate object with the actual ID
  const cleanCandidate = {
    ...candidate,
    actualId: actualDbId,
    canId: actualDbId,
    id: actualDbId
  };
  
  console.log("Clean candidate created with ID:", cleanCandidate.id);
  
  setEditingCandidate(cleanCandidate);
  
  setEditFormData({
    name: candidate.name || "",
    email: candidate.email || "",
    mobile: candidate.mobile || "",
    experience: candidate.experience || "",
    currentOrg: candidate.currentOrg || "",
    currentCTC: candidate.currentCTC || "",
    expectedCTC: candidate.expectedCTC || "",
    noticePeriod: candidate.noticePeriod || "",
    profileSourcedBy: candidate.profileSourcedBy || "",
    clientName: candidate.clientName || "",
    profileSubmissionDate: candidate.profileSubmissionDate || "",
    keySkills: parseKeySkills(candidate.keySkills),
    visaType: candidate.visaType || "NA",
    resumePdf: null
  });
  
  if (candidate.profileSubmissionDate) {
    const parts = candidate.profileSubmissionDate.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parts[1];
      const year = parseInt('20' + parts[2]);
      
      const monthMap = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
      };
      
      if (monthMap[month] !== undefined) {
        const date = new Date(year, monthMap[month], day);
        setEditProfileSubmissionDate(date);
      }
    }
  }
  
  setEditPdfFile(null);
  setEditFormErrors({});
  setShowEditModal(true);
};

  // Handle edit input change
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
    if (editFormErrors[name]) {
      setEditFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle edit skill input change with suggestions
  const handleEditSkillInputChange = (e) => {
    const value = e.target.value;
    setEditSkillInput(value);
    setSelectedEditSkillSuggestionIndex(0);
    
    const lastPart = value.split(',').pop().trim();
    
    if (lastPart) {
      const filtered = skillSuggestions.filter(skill => 
        skill.toLowerCase().includes(lastPart.toLowerCase())
      );
      setFilteredEditSkillSuggestions(filtered);
      setShowEditSkillSuggestions(true);
    } else {
      setFilteredEditSkillSuggestions([]);
      setShowEditSkillSuggestions(false);
    }
  };

  // Handle edit skill key down for navigation
  const handleEditSkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedEditSkillSuggestionIndex(prev => 
        prev < filteredEditSkillSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedEditSkillSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEditSkillSuggestions.length > 0 && selectedEditSkillSuggestionIndex >= 0) {
        const indexToUse = selectedEditSkillSuggestionIndex >= 0 ? selectedEditSkillSuggestionIndex : 0;
        handleEditSkillAdd(filteredEditSkillSuggestions[indexToUse]);
      } else if (editSkillInput.trim()) {
        handleEditSkillAdd();
      }
    } else if (e.key === 'Escape') {
      setShowEditSkillSuggestions(false);
      setSelectedEditSkillSuggestionIndex(0);
    }
  };

// Handle edit skill add - ADD AS SINGLE SKILL
const handleEditSkillAdd = (skillToAdd = null) => {
  const skill = skillToAdd || editSkillInput.trim();
  
  if (!skill) return;
  
  // Don't split by comma - treat as single skill
  const skillExists = skillSuggestions.some(
    existingSkill => existingSkill.toLowerCase() === skill.toLowerCase()
  );
  
  if (skillExists) {
    if (!editFormData.keySkills.includes(skill)) {
      setEditFormData(prev => ({
        ...prev,
        keySkills: [...prev.keySkills, skill]  // Add as separate skill
      }));
      console.log(`✅ Added skill to edit: ${skill}`);
    } else {
      alert(`"${skill}" is already added`);
      return;
    }
  } else {
    alert(`"${skill}" is not a valid skill. Please select from the suggestions.`);
  }
  
  if (editFormErrors.keySkills) {
    setEditFormErrors(prev => ({ ...prev, keySkills: null }));
  }
  
  setEditSkillInput("");
  setShowEditSkillSuggestions(false);
  setSelectedEditSkillSuggestionIndex(0);
};

  // Handle edit skill remove
  const handleEditSkillRemove = (skillToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      keySkills: prev.keySkills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Handle edit PDF upload with 10MB limit
const handleEditPdfUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      e.target.value = '';
      return;
    }
    
    // 10MB limit (10 * 1024 * 1024 = 10485760 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`File size must be less than 10MB. Current file size: ${fileSizeInMB}MB`);
      e.target.value = '';
      return;
    }
    
    setEditPdfFile(file);
    setEditFormData(prev => ({ ...prev, resumePdf: file }));
  }
};

// Validate edit form
const validateEditForm = async () => {
  const errors = {};
  
  if (!editFormData.name?.trim()) {
    errors.name = "Name is required";
  }
  
  if (!editFormData.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
    errors.email = "Email is invalid";
  }
  
  // Mobile number validation - remove any spaces or special characters
 if (!editFormData.mobile?.trim()) {
  errors.mobile = "Mobile number is required";
} else {
  const mobileDigits = editFormData.mobile.replace(/\D/g, '');
  if (mobileDigits.length !== 10 && mobileDigits.length !== 11) {
    errors.mobile = "Mobile number must be 10 or 11 digits";
  } else if (!/^\d{10,11}$/.test(mobileDigits)) {
    errors.mobile = "Mobile number must contain only numbers";
  }
}

  
  if (editFormData.keySkills.length === 0) {
    errors.keySkills = "At least one skill is required";
  }
  
  return errors;
};

const handleUpdateProfile = async () => {
  const errors = await validateEditForm();
  if (Object.keys(errors).length > 0) {
    setEditFormErrors(errors);
    return;
  }

  try {
    setEditLoading(true);
    setEditFormErrors({});
    
    console.log("=== UPDATE PROFILE DEBUG ===");
    console.log("editingCandidate object:", editingCandidate);
    
    // Get the candidate ID - it should now be a number
    let candidateId = editingCandidate?.actualId || editingCandidate?.canId || editingCandidate?.id;
    
    console.log("Raw candidateId:", candidateId);
    console.log("Type of candidateId:", typeof candidateId);
    
    // If it's a string and starts with 'temp-', it's invalid
    if (candidateId && typeof candidateId === 'string' && candidateId.startsWith('temp-')) {
      console.error("Found temp ID:", candidateId);
      candidateId = null;
    }
    
    // Convert to number if it's a string number
    if (candidateId && typeof candidateId === 'string' && !isNaN(candidateId)) {
      candidateId = parseInt(candidateId);
    }
    
    console.log("Final candidate ID to use:", candidateId);
    console.log("Type of candidate ID:", typeof candidateId);
    
    if (!candidateId || isNaN(candidateId)) {
      console.error("Invalid candidate ID:", candidateId);
      throw new Error("Invalid candidate ID - cannot update. Please refresh the page and try again.");
    }
    
    const formData = new FormData();
    formData.append('name', editFormData.name);
    formData.append('email', editFormData.email);
    formData.append('mobile', editFormData.mobile);
    formData.append('experience', editFormData.experience || '');
    formData.append('currentOrg', editFormData.currentOrg || '');
    formData.append('currentCTC', editFormData.currentCTC || '');
    formData.append('expectedCTC', editFormData.expectedCTC || '');
    formData.append('noticePeriod', editFormData.noticePeriod || '');
    formData.append('profileSourcedBy', editFormData.profileSourcedBy || '');
    formData.append('clientName', editFormData.clientName || '');
    
    if (editProfileSubmissionDate) {
      const day = editProfileSubmissionDate.getDate().toString().padStart(2, '0');
      const month = editProfileSubmissionDate.toLocaleString('default', { month: 'short' });
      const year = editProfileSubmissionDate.getFullYear().toString().slice(-2);
      const formattedDate = `${day}-${month}-${year}`;
      formData.append('profileSubmissionDate', formattedDate);
    } else {
      formData.append('profileSubmissionDate', editFormData.profileSubmissionDate || '');
    }
    
    formData.append('keySkills', JSON.stringify(editFormData.keySkills));
    formData.append('visaType', editFormData.visaType || 'NA');
    
    if (editPdfFile) {
      formData.append('resume', editPdfFile);
    }
    
    console.log(`Sending PUT request to: http://localhost:5000/api/candidates/${candidateId}`);
    
    const response = await axios.put(`http://localhost:5000/api/candidates/${candidateId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data.success) {
      setSuccessMessage("Profile updated successfully!");
      await fetchAllCandidates();
      
      setSelectedCandidates(prev => 
        prev.map(c => c.id === editingCandidate.id ? processCandidate({ ...c, ...editFormData }) : c)
      );
      
      setTimeout(() => {
        setShowEditModal(false);
        setSuccessMessage("");
        setEditingCandidate(null);
        setEditFormData({
          name: "",
          email: "",
          mobile: "",
          experience: "",
          currentOrg: "",
          currentCTC: "",
          expectedCTC: "",
          noticePeriod: "",
          profileSourcedBy: "",
          clientName: "",
          profileSubmissionDate: "",
          keySkills: [],
          visaType: "NA",
          resumePdf: null
        });
        setEditProfileSubmissionDate(null);
        setEditSkillInput("");
        setEditPdfFile(null);
      }, 1000);
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    
    if (err.response) {
      console.error('Response data:', err.response.data);
      console.error('Response status:', err.response.status);
      
      setEditFormErrors({
        submit: err.response.data?.message || `Server error: ${err.response.status}`
      });
    } else if (err.request) {
      console.error('No response received:', err.request);
      setEditFormErrors({
        submit: "No response from server. Please check if backend is running."
      });
    } else {
      console.error('Error setting up request:', err.message);
      setEditFormErrors({
        submit: err.message || "Failed to update profile. Please try again."
      });
    }
  } finally {
    setEditLoading(false);
  }
};

  // Handle delete click
  const handleDeleteClick = (candidate, e) => {
    e.stopPropagation();
    if (!candidate || !candidate.id) {
      console.error("Invalid candidate for deletion:", candidate);
      alert("Cannot delete: Invalid candidate data");
      return;
    }
    setDeletingCandidateId(candidate.id);
    setDeletingCandidateName(candidate.name);
    setShowDeleteConfirm(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingCandidateId) {
      console.error("No candidate ID for deletion");
      alert("Cannot delete: No candidate selected");
      setShowDeleteConfirm(false);
      return;
    }

    try {
      setDeleteLoading(true);
      
      const response = await axios.delete(`http://localhost:5000/api/candidates/${deletingCandidateId}`);
      
      if (response.data.success) {
        setSuccessMessage("Profile deleted successfully!");
        
        await fetchAllCandidates();
        
        setSelectedCandidates(prev => prev.filter(c => c.id !== deletingCandidateId));
        
        setTimeout(() => {
          setShowDeleteConfirm(false);
          setSuccessMessage("");
          setDeletingCandidateId(null);
          setDeletingCandidateName("");
        }, 1000);
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
      setError(err.response?.data?.message || "Failed to delete profile. Please try again.");
      setTimeout(() => {
        setError(null);
        setShowDeleteConfirm(false);
        setDeletingCandidateId(null);
        setDeletingCandidateName("");
      }, 3000);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter candidates by search term
  const filterCandidatesBySearch = () => {
    if (!searchTerm.trim()) {
      return displayedCandidates;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return displayedCandidates.filter(candidate => {
      return (
        (candidate.name && candidate.name.toLowerCase().includes(searchLower)) ||
        (candidate.email && candidate.email.toLowerCase().includes(searchLower)) ||
        (candidate.currentOrg && candidate.currentOrg.toLowerCase().includes(searchLower)) ||
        (candidate.clientName && candidate.clientName.toLowerCase().includes(searchLower)) ||
        (candidate.mobile && candidate.mobile.includes(searchLower)) ||
        (candidate.keySkills && Array.isArray(candidate.keySkills) && 
         candidate.keySkills.some(skill => skill && skill.toLowerCase().includes(searchLower)))
      );
    });
  };

// Filter candidates by skill
// Filter candidates by skill
const filterCandidatesBySkill = async (skill) => {
  if (skill === "All") {
    setDisplayedCandidates(candidates);
    setSelectedSkill("All");
    setCurrentPage(1);
    setSearchTerm("");
    return;
  }

  try {
    setFilterLoading(true);
    setError(null);
    
    console.log(`🔍 Filtering candidates by skill: ${skill}`);
    
    // Call the skillsmatch endpoint
    const response = await axios.get(`http://localhost:5000/api/skillsmatch?skill=${encodeURIComponent(skill)}`);
    
    console.log("Skills match response:", response.data);
    
    if (response.data.success) {
      const apiCandidates = response.data.data || [];
      
      console.log(`API returned ${apiCandidates.length} candidates`);
      
      // Process each candidate using the existing processCandidate function
      const parsedCandidates = apiCandidates
        .map(candidate => processCandidate(candidate))
        .filter(c => c !== null);
      
      console.log(`Processed ${parsedCandidates.length} candidates`);
      
      // Log the first candidate's skills to verify
      if (parsedCandidates.length > 0) {
        console.log("First candidate skills:", parsedCandidates[0].keySkills);
      }
      
      parsedCandidates.sort((a, b) => {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return idB - idA;
      });
      
      setDisplayedCandidates(parsedCandidates);
      setCurrentPage(1);
      setSelectedSkill(skill);
      setSearchTerm("");
      
      console.log(`✅ Filtered to ${parsedCandidates.length} candidates with skill: ${skill}`);
    } else {
      console.error("API returned error:", response.data.message);
      // Fallback to local filtering
      const localFiltered = candidates.filter(candidate => {
        const skills = parseKeySkills(candidate.keySkills);
        const hasSkill = skills.some(s => s.toLowerCase() === skill.toLowerCase());
        console.log(`Candidate ${candidate.name} skills:`, skills, `has ${skill}:`, hasSkill);
        return hasSkill;
      });
      
      console.log(`Local filter found ${localFiltered.length} candidates`);
      setDisplayedCandidates(localFiltered);
      setCurrentPage(1);
      setSelectedSkill(skill);
      setSearchTerm("");
    }
  } catch (err) {
    console.error('Error filtering candidates:', err);
    
    // Fallback to local filtering
    const localFiltered = candidates.filter(candidate => {
      const skills = parseKeySkills(candidate.keySkills);
      return skills.some(s => s.toLowerCase() === skill.toLowerCase());
    });
    
    setDisplayedCandidates(localFiltered);
    setCurrentPage(1);
    setSelectedSkill(skill);
    setSearchTerm("");
  } finally {
    setFilterLoading(false);
  }
};

  const handleSkillSelect = (skill) => {
    filterCandidatesBySkill(skill);
  };

// In Recruiter.jsx - Updated handleSelectCandidate
const handleSelectCandidate = async (candidate, e) => {
  e.stopPropagation();
  
  const demandId = searchParams.get('demandId');
  
  if (demandId) {
    const isAlreadySelected = selectedCandidates.some(c => c.id === candidate.id);
    
    if (!isAlreadySelected) {
      try {
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const selectedByName = user.username || user.name || 'Unknown';
        
        const candidateData = {
          canId: candidate.canId || candidate.actualId || candidate.id,
          status: 'Pending Screening'
        };
        
        // Add to local state immediately
        setSelectedCandidates(prev => [...prev, {
          ...candidate,
          status: 'Pending Screening'
        }]);
        
        const response = await axios.post(
          `http://localhost:5000/api/selected-candidates/${demandId}`,
          {
            candidates: [candidateData],
            selectedBy: selectedByName
          }
        );
        
        if (response.data.success) {
          setSuccessMessage(`✅ ${candidate.name} added to demand!`);
          setTimeout(() => setSuccessMessage(""), 2000);
        }
        
      } catch (err) {
        console.error('Error saving candidate:', err);
        setSelectedCandidates(prev => prev.filter(c => c.id !== candidate.id));
        setError(`Failed to save ${candidate.name}`);
        setTimeout(() => setError(null), 3000);
      }
    }
  } else {
    // Navigate to demand page with candidate data
    console.log("Navigating to demand page");
    sessionStorage.setItem('selectedCandidate', JSON.stringify({
      ...candidate,
      selectedAt: new Date().toISOString()
    }));
    navigate('/demand');
  }
};
// Handle removing candidate from selection
const handleRemoveCandidate = async (candidateId, e) => {
  if (e) e.stopPropagation();
  if (!candidateId) return;
  
  // Find the candidate name for the message
  const candidate = selectedCandidates.find(c => c.id === candidateId);
  
  try {
    // Get demandId from URL params
    const demandId = searchParams.get('demandId');
    
    if (!demandId) {
      alert("Demand ID not found");
      return;
    }
    
    // Remove from local state immediately
    setSelectedCandidates(prev => prev.filter(c => c.id !== candidateId));
    
    setSuccessMessage(`Removing ${candidate?.name || 'candidate'}...`);
    
    // Remove from database
    await axios.delete(`http://localhost:5000/api/selected-candidates/${demandId}/${candidateId}`);
    
    setSuccessMessage(`✅ ${candidate?.name || 'Candidate'} removed from demand`);
    setTimeout(() => setSuccessMessage(""), 2000);
    
  } catch (err) {
    console.error('Error removing candidate:', err);
    setError("Failed to remove candidate");
    setTimeout(() => setError(null), 3000);
  }
};



  // Handle sending email
const handleSendEmail = (email, e) => {
  e.stopPropagation();
  if (!email) return;
  
  // Direct Outlook Web compose URL - this will open the compose window
  // If the user is already logged in to Outlook Web, it will work directly
  const outlookComposeUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}`;
  
  // Open in new tab
  window.open(outlookComposeUrl, '_blank');
};

  // Handle sending WhatsApp
  const handleSendWhatsApp = (mobile, e) => {
    e.stopPropagation();
    if (!mobile) return;
    const message = "Hello, I came across your profile and wanted to discuss a job opportunity.";
    window.open(`https://wa.me/${mobile.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

 // Handle PDF file upload with 10MB limit
const handlePdfUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      e.target.value = '';
      return;
    }
    
    // 10MB limit (10 * 1024 * 1024 = 10485760 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      alert(`File size must be less than 10MB. Current file size: ${fileSizeInMB}MB`);
      e.target.value = '';
      return;
    }
    
    setPdfFile(file);
    setNewProfile(prev => ({ ...prev, resumePdf: file }));
  }
};

  // Handle add skill input change with suggestions
  const handleAddSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillInput(value);
    setSelectedAddSkillSuggestionIndex(0);
    
    const lastPart = value.split(',').pop().trim();
    
    if (lastPart) {
      const filtered = skillSuggestions.filter(skill => 
        skill.toLowerCase().includes(lastPart.toLowerCase())
      );
      setFilteredAddSkillSuggestions(filtered);
      setShowAddSkillSuggestions(true);
    } else {
      setFilteredAddSkillSuggestions([]);
      setShowAddSkillSuggestions(false);
    }
  };

 // Handle add skill key down for navigation
const handleAddSkillKeyDown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setSelectedAddSkillSuggestionIndex(prev => 
      prev < filteredAddSkillSuggestions.length - 1 ? prev + 1 : prev
    );
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setSelectedAddSkillSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    
    if (filteredAddSkillSuggestions.length > 0) {
      const indexToUse = selectedAddSkillSuggestionIndex >= 0 ? selectedAddSkillSuggestionIndex : 0;
      const selectedSkill = filteredAddSkillSuggestions[indexToUse];
      handleAddSkillToProfile(selectedSkill);
    } else if (skillInput.trim()) {
      // Add as single skill, don't split by comma
      handleAddSkillToProfile();
    }
  } else if (e.key === 'Escape') {
    setShowAddSkillSuggestions(false);
    setSelectedAddSkillSuggestionIndex(0);
  }
};

// Helper function to get border color based on visa type
const getVisaBorderColor = (visaType) => {
  if (!visaType || visaType === "NA") return "border-gray-200";
  
  // Only China gets blue border
  if (visaType.toUpperCase() === "CHINA") {
    return "border-blue-500 border-2";
  }
  
  // All other visa types get red border
  return "border-red-500 border-2";
};
// Handle adding new skill to database (for sidebar admin)
const handleAddSkillToDatabase = async () => {
  if (!newSkillName.trim()) return;
  
  try {
    setSkillsLoading(true);
    const response = await axios.post('http://localhost:5000/api/skills', {
      name: newSkillName.trim()
    });
    
    if (response.data.success) {
      // Refresh skills list
      await fetchSkillsData();
      setSuccessMessage(`Skill "${newSkillName}" added successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);
      setNewSkillName("");
      setShowAddSkillInput(false);
    } else {
      setError(response.data.message || "Failed to add skill");
    }
  } catch (err) {
    console.error('Error adding skill:', err);
    setError(err.response?.data?.message || "Failed to add skill. Please try again.");
  } finally {
    setSkillsLoading(false);
  }
};

  // Handle deleting skill
  const handleDeleteSkill = async (skillName, e) => {
    e.stopPropagation();
    
    if (!window.confirm(`Are you sure you want to delete the skill "${skillName}"?`)) {
      return;
    }

    try {
      setSkillsLoading(true);
      const response = await axios.delete(`http://localhost:5000/api/skills/${encodeURIComponent(skillName)}`);

      if (response.data.success) {
        await fetchSkillsData();
        setSuccessMessage(`Skill "${skillName}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError(err.response?.data?.message || "Failed to delete skill");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSkillsLoading(false);
    }
  };

  // State for new skill input
  const [newSkillName, setNewSkillName] = useState("");
  const [showAddSkillInput, setShowAddSkillInput] = useState(false);

  // Handle removing a skill (for add profile form)
  const handleRemoveSkill = (skillToRemove) => {
    setNewProfile(prev => ({
      ...prev,
      keySkills: prev.keySkills.filter(skill => skill !== skillToRemove)
    }));
  };

// Validate form fields
const validateForm = async () => {
  const errors = {};
  
  if (!newProfile.name?.trim()) {
    errors.name = "Name is required";
  }
  
  if (!newProfile.email?.trim()) {
    errors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(newProfile.email)) {
    errors.email = "Email is invalid";
  } else {
    const emailExists = await checkEmailExists(newProfile.email);
    if (emailExists) {
      errors.email = "This email is already registered";
    }
  }
  
 // Mobile number validation - allow 10 or 11 digits
if (!newProfile.mobile?.trim()) {
  errors.mobile = "Mobile number is required";
} else {
  const mobileDigits = newProfile.mobile.replace(/\D/g, '');
  if (mobileDigits.length !== 10 && mobileDigits.length !== 11) {
    errors.mobile = "Mobile number must be 10 or 11 digits";
  } else if (!/^\d{10,11}$/.test(mobileDigits)) {
    errors.mobile = "Mobile number must contain only numbers";
  } else {
    const mobileExists = await checkMobileExists(mobileDigits);
    if (mobileExists) {
      errors.mobile = "This mobile number is already registered";
    }
  }
}
  
  if (newProfile.keySkills.length === 0) {
    errors.keySkills = "At least one skill is required";
  }
  
  return errors;
};

  // Handle adding new profile
  const handleAddProfile = async () => {
    const errors = await validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitLoading(true);
      setFormErrors({});
      
      const formData = new FormData();
      formData.append('name', newProfile.name);
      formData.append('email', newProfile.email);
      formData.append('mobile', newProfile.mobile);
      formData.append('experience', newProfile.experience || '');
      formData.append('currentOrg', newProfile.currentOrg || '');
      formData.append('currentCTC', newProfile.currentCTC || '');
      formData.append('expectedCTC', newProfile.expectedCTC || '');
      formData.append('noticePeriod', newProfile.noticePeriod || '');
      formData.append('profileSourcedBy', newProfile.profileSourcedBy || '');
      formData.append('clientName', newProfile.clientName || '');
      
      if (profileSubmissionDate) {
        const day = profileSubmissionDate.getDate().toString().padStart(2, '0');
        const month = profileSubmissionDate.toLocaleString('default', { month: 'short' });
        const year = profileSubmissionDate.getFullYear().toString().slice(-2);
        const formattedDate = `${day}-${month}-${year}`;
        formData.append('profileSubmissionDate', formattedDate);
      } else {
        const today = new Date();
        const day = today.getDate().toString().padStart(2, '0');
        const month = today.toLocaleString('default', { month: 'short' });
        const year = today.getFullYear().toString().slice(-2);
        const formattedDate = `${day}-${month}-${year}`;
        formData.append('profileSubmissionDate', formattedDate);
      }
      
      formData.append('keySkills', JSON.stringify(newProfile.keySkills));
      formData.append('visaType', newProfile.visaType || 'NA');
      
      if (newProfile.resumePdf) {
        formData.append('resume', newProfile.resumePdf);
      }
      
      const response = await axios.post('http://localhost:5000/api/candidates', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccessMessage("Profile added successfully!");
        
        await fetchAllCandidates();
        
        setTimeout(() => {
          setShowAddProfile(false);
          setSuccessMessage("");
          setNewProfile({
            name: "",
            email: "",
            mobile: "",
            experience: "",
            currentOrg: "",
            currentCTC: "",
            expectedCTC: "",
            noticePeriod: "",
            profileSourcedBy: "",
            clientName: "",
            profileSubmissionDate: "",
            keySkills: [],
            visaType: "NA",
            resumePdf: null
          });
          setProfileSubmissionDate(null);
          setSkillInput("");
          setPdfFile(null);
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

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProfile(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle primary skill input
  const handlePrimarySkillInputChange = (e) => {
    const value = e.target.value;
    setPrimarySkillInput(value);
    setSelectedPrimarySuggestionIndex(0);
    
    const lastPart = value.split(',').pop().trim();
    
    if (lastPart) {
      const filtered = skillSuggestions.filter(skill => 
        skill.toLowerCase().includes(lastPart.toLowerCase())
      );
      setFilteredPrimarySuggestions(filtered);
      setShowPrimarySuggestions(true);
    } else {
      setFilteredPrimarySuggestions([]);
      setShowPrimarySuggestions(false);
    }
  };

  // Handle secondary skill input
  const handleSecondarySkillInputChange = (e) => {
    const value = e.target.value;
    setSecondarySkillInput(value);
    setSelectedSecondarySuggestionIndex(0);
    
    const lastPart = value.split(',').pop().trim();
    
    if (lastPart) {
      const filtered = skillSuggestions.filter(skill => 
        skill.toLowerCase().includes(lastPart.toLowerCase())
      );
      setFilteredSecondarySuggestions(filtered);
      setShowSecondarySuggestions(true);
    } else {
      setFilteredSecondarySuggestions([]);
      setShowSecondarySuggestions(false);
    }
  };

  // Handle primary skill key down for navigation
  const handlePrimarySkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPrimarySuggestionIndex(prev => 
        prev < filteredPrimarySuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPrimarySuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredPrimarySuggestions.length > 0 && selectedPrimarySuggestionIndex >= 0) {
        const indexToUse = selectedPrimarySuggestionIndex >= 0 ? selectedPrimarySuggestionIndex : 0;
        selectPrimarySkill(filteredPrimarySuggestions[indexToUse]);
      } else if (primarySkillInput.trim()) {
        if (primarySkillInput.includes(',')) {
          const skills = primarySkillInput.split(',').map(s => s.trim()).filter(s => s);
          setSearchFilters(prev => ({
            ...prev,
            primarySkills: [...new Set([...prev.primarySkills, ...skills])]
          }));
        } else {
          setSearchFilters(prev => ({
            ...prev,
            primarySkills: [...new Set([...prev.primarySkills, primarySkillInput.trim()])]
          }));
        }
      }
    } else if (e.key === 'Escape') {
      setShowPrimarySuggestions(false);
      setSelectedPrimarySuggestionIndex(0);
    }
  };

  // Handle secondary skill key down for navigation
  const handleSecondarySkillKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSecondarySuggestionIndex(prev => 
        prev < filteredSecondarySuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSecondarySuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSecondarySuggestions.length > 0 && selectedSecondarySuggestionIndex >= 0) {
        const indexToUse = selectedSecondarySuggestionIndex >= 0 ? selectedSecondarySuggestionIndex : 0;
        selectSecondarySkill(filteredSecondarySuggestions[indexToUse]);
      } else if (secondarySkillInput.trim()) {
        if (secondarySkillInput.includes(',')) {
          const skills = secondarySkillInput.split(',').map(s => s.trim()).filter(s => s);
          setSearchFilters(prev => ({
            ...prev,
            secondarySkills: [...new Set([...prev.secondarySkills, ...skills])]
          }));
        } else {
          setSearchFilters(prev => ({
            ...prev,
            secondarySkills: [...new Set([...prev.secondarySkills, secondarySkillInput.trim()])]
          }));
        }
      }
    } else if (e.key === 'Escape') {
      setShowSecondarySuggestions(false);
      setSelectedSecondarySuggestionIndex(0);
    }
  };

  // Handle primary skill selection from suggestions
  const selectPrimarySkill = (skill) => {
    const parts = primarySkillInput.split(',');
    if (parts.length > 1) {
      parts[parts.length - 1] = skill;
      setPrimarySkillInput(parts.join(', '));
    } else {
      setPrimarySkillInput(skill);
    }
    
    setSearchFilters(prev => ({
      ...prev,
      primarySkills: [...new Set([...prev.primarySkills, skill])]
    }));
    setFilteredPrimarySuggestions([]);
    setShowPrimarySuggestions(false);
    setSelectedPrimarySuggestionIndex(0);
  };

  // Handle secondary skill selection from suggestions
  const selectSecondarySkill = (skill) => {
    const parts = secondarySkillInput.split(',');
    if (parts.length > 1) {
      parts[parts.length - 1] = skill;
      setSecondarySkillInput(parts.join(', '));
    } else {
      setSecondarySkillInput(skill);
    }
    
    setSearchFilters(prev => ({
      ...prev,
      secondarySkills: [...new Set([...prev.secondarySkills, skill])]
    }));
    setFilteredSecondarySuggestions([]);
    setShowSecondarySuggestions(false);
    setSelectedSecondarySuggestionIndex(0);
  };

  // Handle search input click
  const handleSearchClick = () => {
    setShowSearchPopup(true);
  };

  // Handle search filter change
  const handleSearchFilterChange = (e) => {
    const { name, value } = e.target;
    setSearchFilters(prev => ({ ...prev, [name]: value }));
  };

  // Apply search filters
  const applySearchFilters = async () => {
    try {
      setFilterLoading(true);
      setError(null);
      
      let updatedFilters = { ...searchFilters };
      
      if (primarySkillInput.trim()) {
        let newPrimarySkills = [];
        if (primarySkillInput.includes(',')) {
          newPrimarySkills = primarySkillInput.split(',').map(s => s.trim()).filter(s => s);
        } else {
          newPrimarySkills = [primarySkillInput.trim()];
        }
        updatedFilters.primarySkills = [...new Set(newPrimarySkills)];
      } else {
        updatedFilters.primarySkills = [];
      }
      
      if (secondarySkillInput.trim()) {
        let newSecondarySkills = [];
        if (secondarySkillInput.includes(',')) {
          newSecondarySkills = secondarySkillInput.split(',').map(s => s.trim()).filter(s => s);
        } else {
          newSecondarySkills = [secondarySkillInput.trim()];
        }
        updatedFilters.secondarySkills = [...new Set(newSecondarySkills)];
      } else {
        updatedFilters.secondarySkills = [];
      }
      
      console.log("Applying search with updated filters:", updatedFilters);
      
      const params = new URLSearchParams();
      
      if (updatedFilters.primarySkills.length > 0) {
        params.append('primarySkills', updatedFilters.primarySkills.join(','));
      }
      
      if (updatedFilters.secondarySkills.length > 0) {
        params.append('secondarySkills', updatedFilters.secondarySkills.join(','));
      }
      
      if (updatedFilters.experienceMin) {
        params.append('minExperience', updatedFilters.experienceMin);
      }
      
      if (updatedFilters.experienceMax) {
        params.append('maxExperience', updatedFilters.experienceMax);
      }
      
      console.log("Query params:", params.toString());
      
      const response = await axios.get(`http://localhost:5000/api/shortcandidates/filter?${params.toString()}`);
      
      if (response.data.success) {
        const processedCandidates = response.data.data
          .map(processCandidate)
          .filter(c => c !== null);
        
        console.log(`Smart search found ${processedCandidates.length} candidates`);
        
        setDisplayedCandidates(processedCandidates);
        setSearchFilters(updatedFilters);
        setCurrentPage(1);
        setShowSearchPopup(false);
        setSelectedSkill("All");
        setSearchTerm("");
      } else {
        setError("Failed to filter candidates: " + (response.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error('Error applying filters:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        setError(`Server error: ${err.response.status} - ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('No response received:', err.request);
        setError("No response from server. Please check if backend is running.");
      } else {
        console.error('Error setting up request:', err.message);
        setError(err.message);
      }
      
      try {
        console.log("Falling back to local filtering...");
        
        let filtered = [...candidates];
        
        const allSkills = [...updatedFilters.primarySkills, ...updatedFilters.secondarySkills].filter(s => s);
        
        if (allSkills.length > 0) {
          filtered = filtered.filter(candidate => {
            return candidate.keySkills && Array.isArray(candidate.keySkills) && 
              candidate.keySkills.some(skill => 
                allSkills.some(s => s.toLowerCase() === (skill && skill.toLowerCase()))
              );
          });
        }
        
        if (updatedFilters.experienceMin || updatedFilters.experienceMax) {
          const minExp = updatedFilters.experienceMin ? parseFloat(updatedFilters.experienceMin) : 0;
          const maxExp = updatedFilters.experienceMax ? parseFloat(updatedFilters.experienceMax) : Infinity;
          
          filtered = filtered.filter(candidate => {
            const expNum = parseFloat(candidate.experience) || 0;
            
            if (updatedFilters.experienceMin && expNum < minExp) return false;
            if (updatedFilters.experienceMax && expNum > maxExp) return false;
            return true;
          });
        }
        
        filtered.sort((a, b) => {
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idB - idA;
        });
        
        console.log(`Fallback filter found ${filtered.length} candidates`);
        setDisplayedCandidates(filtered);
        
        setSearchFilters(updatedFilters);
        setCurrentPage(1);
        setShowSearchPopup(false);
        setSelectedSkill("All");
        setSearchTerm("");
      } catch (fallbackErr) {
        console.error('Fallback filtering also failed:', fallbackErr);
      }
    } finally {
      setFilterLoading(false);
    }
  };

  // Reset search filters
  const resetSearchFilters = () => {
    setSearchFilters({
      primarySkills: [],
      secondarySkills: [],
      experienceMin: "",
      experienceMax: "",
      location: ""
    });
    setPrimarySkillInput("");
    setSecondarySkillInput("");
    setDisplayedCandidates(candidates);
    setCurrentPage(1);
    setShowSearchPopup(false);
    setSelectedSkill("All");
  };

  // Edit search filters - open popup with current filters
  const editSearchFilters = () => {
    setPrimarySkillInput(searchFilters.primarySkills.join(', '));
    setSecondarySkillInput(searchFilters.secondarySkills.join(', '));
    setShowSearchPopup(true);
  };

  // Toggle selected view
  const toggleSelectedView = () => {
    setShowSelectedView(!showSelectedView);
    setSelectedViewPage(1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to check if status is active (should be shown in recruiter)
const isActiveStatus = (status) => {
  const activeStatuses = [
    'Pending Screening',
    'Pending Interview',
    'Pending Client Screening',
    'Pending Client Interview',
    'Pending Offer',
    'Pending Joinee'
  ];
  return activeStatuses.includes(status);
};

// Add this useEffect in Demand.jsx to check for selected candidate
useEffect(() => {
  const selectedCandidateData = sessionStorage.getItem('selectedCandidate');
  if (selectedCandidateData) {
    const candidate = JSON.parse(selectedCandidateData);
    console.log("Selected candidate from recruiter:", candidate);
    // You can show a message or pre-fill a form here
    setSuccessMessage(`Candidate ${candidate.name} selected. Please create a demand for them.`);
    // Clear the stored data after use
    sessionStorage.removeItem('selectedCandidate');
    
    // Optional: Auto-open create demand form
    // setShowCreateDemand(true);
    // setCreateFormData(prev => ({ ...prev, candidateInfo: candidate }));
  }
}, []);

// Add this useEffect to fetch existing selected candidates when component mounts
useEffect(() => {
  const fetchExistingSelections = async () => {
    const demandId = searchParams.get('demandId');
    if (demandId && candidates.length > 0) {
      try {
        const response = await axios.get(`http://localhost:5000/api/selected-candidates/${demandId}`);
        if (response.data.success) {
          // ⭐ REMOVE THE isActiveStatus FILTER - keep ALL candidates
          const existingCandidates = response.data.data
            .map(selected => {
              const matchingCandidate = candidates.find(c => c.id === selected.id);
              return {
                ...matchingCandidate,
                status: selected.status,
                history: selected.history
              };
            })
            .filter(c => c !== undefined); // Only remove if candidate doesn't exist
          
          setSelectedCandidates(existingCandidates);
          console.log("Loaded selected candidates with statuses:", existingCandidates.map(c => ({ name: c.name, status: c.status })));
        }
      } catch (err) {
        console.error('Error fetching existing selections:', err);
      }
    }
  };
  
  fetchExistingSelections();
}, [searchParams, candidates]);

// Refresh selected candidates when component mounts and when window gets focus
useEffect(() => {
  const refreshSelections = () => {
    const demandId = searchParams.get('demandId');
    if (demandId && candidates.length > 0) {
      fetchExistingSelections();
    }
  };
  
  // Refresh when window gets focus (user returns to tab)
  window.addEventListener('focus', refreshSelections);
  
  return () => {
    window.removeEventListener('focus', refreshSelections);
  };
}, [searchParams, candidates]);

  // Load data on component mount
 // Load data on component mount
useEffect(() => {
  fetchAllCandidates();
  fetchSkillsData();
  fetchVisaTypes(); // Add this line
}, []);

  // Update skill counts whenever candidates change
  useEffect(() => {
    if (skills.length > 0 && candidates.length > 0) {
      updateSkillCounts(candidates);
    }
  }, [candidates, skills]);

  // Get filtered candidates based on search term
  const filteredCandidates = filterCandidatesBySearch();

  // Pagination logic for main view
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination logic for selected candidates view
  const selectedTotalPages = Math.ceil(selectedCandidates.length / itemsPerPage);
  const selectedIndexOfLastItem = selectedViewPage * itemsPerPage;
  const selectedIndexOfFirstItem = selectedIndexOfLastItem - itemsPerPage;
  const selectedCurrentItems = selectedCandidates.slice(selectedIndexOfFirstItem, selectedIndexOfLastItem);

   useEffect(() => {
    const fetchAllClientStatuses = async () => {
      const currentClient = searchParams.get('clientName');
      
      if (!currentClient || currentItems.length === 0) return;
      
      const statusMap = {};
      
      for (const candidate of currentItems) {
        if (candidate.id) {
          const status = await fetchCandidateStatusForClient(candidate.id, currentClient);
          if (status && status.isSelected) {
            statusMap[candidate.id] = status;
          }
        }
      }
      
      setCandidateClientStatus(statusMap);
    };
    
    fetchAllClientStatuses();
  }, [currentItems, searchParams]);

  // Fetch in-progress status for displayed candidates
useEffect(() => {
  const fetchInProgressStatuses = async () => {
    const candidateIds = currentItems.map(c => c.id).filter(id => id);
    
    if (candidateIds.length === 0) return;
    
    try {
      const response = await axios.post('http://localhost:5000/api/candidates/progress/batch', {
        candidateIds: candidateIds
      });
      
      if (response.data.success) {
        const progressMap = {};
        response.data.data.forEach(item => {
          progressMap[item.candidateId] = item.isInProgress;
        });
        setCandidateInProgress(progressMap);
      }
    } catch (err) {
      console.error('Error fetching in-progress statuses:', err);
    }
  };
  
  fetchInProgressStatuses();
}, [currentItems]); // Re-fetch when page changes

  // Pagination handlers
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Selected view pagination handlers
  const goToSelectedPreviousPage = () => setSelectedViewPage(prev => Math.max(prev - 1, 1));
  const goToSelectedNextPage = () => setSelectedViewPage(prev => Math.min(prev + 1, selectedTotalPages));

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
                <span className="font-semibold">{totalSkills}</span> total skills • 
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



  <div className="relative">
    <input
      type="text"
      placeholder="Search candidates..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
      }}
      onClick={handleSearchClick}
      className="pl-10 pr-4 py-2 border-2 border-blue-500 rounded-xl w-64 
               focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
               outline-none"
    />
    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
  </div>
</div>
          </div>
          {/* REMOVE THIS ENTIRE BLOCK */}
{searchParams.get('autoFilter') === 'true' && (
  <button
    onClick={handleSubmitSelectedCandidates}
    disabled={selectedCandidates.length === 0 || submitLoading}
    className={`flex items-center gap-2 px-6 py-2 rounded-xl shadow transition ${
      selectedCandidates.length > 0 && !submitLoading
        ? 'bg-green-600 text-white hover:bg-green-700' 
        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
    }`}
  >
    {submitLoading ? (
      <>
        <Loader size={18} className="animate-spin" />
        Saving...
      </>
    ) : (
      <>
        <CheckCircle size={18} />
        Save Selected ({selectedCandidates.length})
      </>
    )}
  </button>
)}

          {/* Filter Summary with Edit Button */}
          {(searchFilters.primarySkills.length > 0 || searchFilters.secondarySkills.length > 0 || searchFilters.experienceMin || searchFilters.experienceMax) && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-blue-700">Active Filters:</span>
                {searchFilters.primarySkills.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Primary: {searchFilters.primarySkills.join(', ')}
                  </span>
                )}
                {searchFilters.secondarySkills.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    Secondary: {searchFilters.secondarySkills.join(', ')}
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
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={editSearchFilters}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={resetSearchFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* LEFT SIDEBAR - SKILLS WIDGET */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-4 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Skills Filter</h3>
                  <Filter size={18} className="text-gray-500" />
                </div>
                
                {skillsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : (
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
                        {totalSkills}
                      </span>
                    </button>
                    
                    {skills.length > 0 ? (
                      <>
                        {/* Skills List */}
                        {skills.map((skill) => {
                          const count = skillCounts[skill.name] || 0;
                          return (
                            <div key={skill.name} className="flex items-center gap-1">
                              <button
                                onClick={() => handleSkillSelect(skill.name)}
                                disabled={filterLoading}
                                className={`flex-1 text-left px-3 py-2 rounded-lg transition-colors flex justify-between items-center ${
                                  selectedSkill === skill.name
                                    ? "bg-blue-100 text-blue-700 border border-blue-300"
                                    : "hover:bg-gray-100"
                                } ${filterLoading ? 'opacity-50 cursor-wait' : ''}`}
                              >
                                <span className="truncate">{skill.name}</span>
                                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                                  {count}
                                </span>
                              </button>
                              
                              {/* Delete button - only show for admin users */}
                              {userRole && userRole.toLowerCase() === "admin" && (
                                <button
                                  onClick={(e) => handleDeleteSkill(skill.name, e)}
                                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete skill"
                                  disabled={skillsLoading}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )} 
                            </div>
                          );
                        })}
                        
                      {/* Add Skill Section - only show for admin users */}
{userRole && userRole.toLowerCase() === "admin" && (
  <div className="mt-4 pt-4 border-t border-gray-200">
    {showAddSkillInput ? (
      <div className="space-y-2">
        <input
          type="text"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          placeholder="Enter new skill name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddSkillToDatabase();
            }
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={handleAddSkillToDatabase}
            disabled={!newSkillName.trim() || skillsLoading}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Save size={16} />
            Save
          </button>
          <button
            onClick={() => {
              setShowAddSkillInput(false);
              setNewSkillName("");
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => setShowAddSkillInput(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        <Plus size={16} />
        Add New Skill
      </button>
    )}
  </div>
)}
                      </>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No skills found</p>
                    )} 
                  </div>
                )}

                {/* Selected Candidates Panel */}
                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Selected Candidates</h4>
                    <Users size={16} className="text-gray-500" />
                  </div>
                  {selectedCandidates.length === 0 ? (
                    <p className="text-gray-500 text-sm">No candidates selected</p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                      {/* In selected candidates panel */}
{selectedCandidates.map(candidate => (
  <div key={`selected-${candidate.id}`} className="flex items-center justify-between bg-gray-50 p-2 rounded">
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm truncate">{candidate.name}</p>
      <p className="text-xs text-gray-500 truncate">{candidate.currentOrg}</p>
      {candidateInProgress[candidate.id] && (
        <span className="text-xs text-yellow-600 flex items-center gap-1 mt-1">
          <Clock size={10} />
          In Progress
        </span>
      )}
    </div>
    <button
      onClick={(e) => handleRemoveCandidate(candidate.id, e)}
      className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
    >
      <XCircle size={16} />
    </button>
  </div>
))}
                      </div>
                      <button
                        onClick={toggleSelectedView}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Eye size={16} />
                        View Selected ({selectedCandidates.length})
                      </button>
                    </>
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
              {/* Results Summary */}
              <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {showSelectedView 
                        ? "Selected Candidates" 
                        : (selectedSkill === "All" ? "All Candidates" : `${selectedSkill} Professionals`)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {showSelectedView ? (
                        selectedCandidates.length > 0 ? (
                          `Showing ${selectedIndexOfFirstItem + 1} to ${Math.min(selectedIndexOfLastItem, selectedCandidates.length)} of ${selectedCandidates.length} selected candidates`
                        ) : (
                          "No candidates selected"
                        )
                      ) : (
                        filteredCandidates.length > 0 ? (
                          `Showing ${indexOfFirstItem + 1} to ${Math.min(indexOfLastItem, filteredCandidates.length)} of ${filteredCandidates.length} candidates`
                        ) : (
                          "No candidates found"
                        )
                      )}
                      {!showSelectedView && searchTerm && ` (filtered by "${searchTerm}")`}
                    </p>
                  </div>
                  {showSelectedView && (
                    <button
                      onClick={() => setShowSelectedView(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Back to All Candidates
                    </button>
                  )}
                </div>
              </div>

              {/* Candidates Grid */}
              <div className="bg-white rounded-2xl shadow-xl p-4">
                {showSelectedView ? (
                  // Selected Candidates View
                  selectedCandidates.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No candidates selected
                      </h3>
                      <p className="text-gray-500">
                        Select candidates from the main list to view them here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {selectedCurrentItems.map(candidate => {
                          const skills = parseKeySkills(candidate.keySkills);
                          return (
                            <div 
                              key={`selected-card-${candidate.id}`} 
                              className="border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={(e) => handleViewDetails(candidate, e)}
                            >
                              {/* Candidate Header */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-lg truncate hover:text-blue-600">{candidate.name}</h4>
                                  <p className="text-gray-600 text-sm truncate">{candidate.currentOrg}</p>
                                </div>
                                <button
                                  onClick={(e) => handleRemoveCandidate(candidate.id, e)}
                                  className="px-3 py-1 rounded text-sm ml-2 flex-shrink-0 bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  Remove
                                </button>
                              </div>

                              {/* Candidate Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>{candidate.mobile}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Briefcase size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>Exp: {candidate.experience} years</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>Client: {candidate.clientName || "N/A"}</span>
                                </div>
                              </div>

{/* Skills in selected view - Blue box for each skill */}
<div className="mb-4">
  <p className="text-sm font-medium mb-2">Key Skills:</p>
  <div className="flex flex-wrap gap-2">
    {(() => {
      let skillsArray = [];
      
      if (Array.isArray(candidate.keySkills)) {
        skillsArray = candidate.keySkills;
      } else if (typeof candidate.keySkills === 'string') {
        try {
          const parsed = JSON.parse(candidate.keySkills);
          skillsArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          if (candidate.keySkills.includes(',')) {
            skillsArray = candidate.keySkills.split(',').map(s => s.trim());
          } else {
            skillsArray = [candidate.keySkills.trim()];
          }
        }
      }
      
      // Clean each skill (remove quotes and brackets)
      skillsArray = skillsArray.map(skill => {
        if (typeof skill === 'string') {
          return skill.replace(/["'\[\]]/g, '').trim();
        }
        return skill;
      }).filter(skill => skill && skill !== '');
      
      if (skillsArray.length > 0) {
        return skillsArray.map((skill, index) => (
          <span
            key={`${candidate.id}-skill-${index}`}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ));
      } else {
        return <span className="text-sm text-gray-400 italic">No skills listed</span>;
      }
    })()}
  </div>
</div>
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleSendEmail(candidate.email, e)}
                                  className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                  title="Send Email"
                                >
                                  <Mail size={14} />
                                  Email
                                </button>
                                <button
                                  onClick={(e) => handleSendWhatsApp(candidate.mobile, e)}
                                  className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                  title="Send WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                  WhatsApp
                                </button>
                                <button
                                  onClick={(e) => handleViewResume(candidate, e)}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                                    candidate.resumePath || candidate.googleDriveViewLink
                                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={candidate.resumePath || candidate.googleDriveViewLink ? "View Resume" : "No Resume Available"}
                                  disabled={!candidate.resumePath && !candidate.googleDriveViewLink}
                                >
                                  <FileText size={14} />
                                  Resume
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination for selected view */}
                      {selectedTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Page {selectedViewPage} of {selectedTotalPages}</span>
                          </div>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={goToSelectedPreviousPage}
                              disabled={selectedViewPage === 1}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                              <ChevronLeft size={18} />
                              Previous
                            </button>
                            <button
                              onClick={goToSelectedNextPage}
                              disabled={selectedViewPage === selectedTotalPages}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                              Next
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                ) : (
                  // Main Candidates View
                  currentItems.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No candidates found
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm 
                          ? `No results for "${searchTerm}"`
                          : selectedSkill !== "All" 
                            ? `No candidates with skill "${selectedSkill}"`
                            : "No candidates available"}
                      </p>
                      {(searchTerm || selectedSkill !== "All") && (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedSkill("All");
                            setDisplayedCandidates(candidates);
                          }}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {currentItems.map(candidate => {
                          const skills = parseKeySkills(candidate.keySkills);
                          return (
                            <div 
                              key={`candidate-${candidate.id}`} 
                              className={`border rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer ${getVisaBorderColor(candidate.visaType)}`}
                              onClick={(e) => handleViewDetails(candidate, e)}
                            >
                              {/* Candidate Header */}
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-bold text-lg truncate hover:text-blue-600">{candidate.name}</h4>
                                  <p className="text-gray-600 text-sm truncate">{candidate.currentOrg}</p>
                                </div>
                                
{/* Visa Type Badge */}
{candidate.visaType && candidate.visaType !== "NA" && (
  <span className={`ml-2 px-2 py-1 text-xs rounded-full font-medium ${
    candidate.visaType === "China" 
      ? "bg-blue-100 text-blue-800"  // China - Blue
      : "bg-red-100 text-red-800"     // All other visa types - Red
  }`}>
    {candidate.visaType}
  </span>
)}
                                
{/* In the candidate card - Replace the button section */}
<div className="flex gap-1 ml-2 flex-shrink-0">
  <button
    onClick={(e) => handleEditClick(candidate, e)}
    className="p-1.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
    title="Edit Candidate"
  >
    <Edit2 size={16} />
  </button>
  <button
    onClick={(e) => handleDeleteClick(candidate, e)}
    className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200"
    title="Delete Candidate"
  >
    <Trash2 size={16} />
  </button>
  
  {/* Check if candidate is in progress */}
  {candidateInProgress[candidate.id] ? (
    // If YES - show "In Progress" badge
    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium flex items-center gap-1">
      <Clock size={14} />
      In Progress
    </span>
  ) : (
    // If NO - show "Select" button
    <button
      onClick={(e) => handleSelectCandidate(candidate, e)}
      className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm font-medium"
    >
      Select
    </button>
  )}
</div>
                              </div>

                              {/* Candidate Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>{candidate.mobile}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Briefcase size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>Exp: {candidate.experience} years</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Building2 size={14} className="text-gray-500 flex-shrink-0" />
                                  <span>Client: {candidate.clientName || "N/A"}</span>
                                </div>
                              </div>

 {/* Skills in selected view - Blue box for each skill */}
<div className="mb-4">
  <p className="text-sm font-medium mb-2">Key Skills:</p>
  <div className="flex flex-wrap gap-2">
    {(() => {
      let skillsArray = [];
      
      if (Array.isArray(candidate.keySkills)) {
        skillsArray = candidate.keySkills;
      } else if (typeof candidate.keySkills === 'string') {
        try {
          const parsed = JSON.parse(candidate.keySkills);
          skillsArray = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          if (candidate.keySkills.includes(',')) {
            skillsArray = candidate.keySkills.split(',').map(s => s.trim());
          } else {
            skillsArray = [candidate.keySkills.trim()];
          }
        }
      }
      
      // Clean each skill (remove quotes and brackets)
      skillsArray = skillsArray.map(skill => {
        if (typeof skill === 'string') {
          return skill.replace(/["'\[\]]/g, '').trim();
        }
        return skill;
      }).filter(skill => skill && skill !== '');
      
      if (skillsArray.length > 0) {
        return skillsArray.map((skill, index) => (
          <span
            key={`${candidate.id}-skill-${index}`}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ));
      } else {
        return <span className="text-sm text-gray-400 italic">No skills listed</span>;
      }
    })()}
  </div>
</div>

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => handleSendEmail(candidate.email, e)}
                                  className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                  title="Send Email"
                                >
                                  <Mail size={14} />
                                  Email
                                </button>
                                <button
                                  onClick={(e) => handleSendWhatsApp(candidate.mobile, e)}
                                  className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                  title="Send WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                  WhatsApp
                                </button>
                                <button
                                  onClick={(e) => handleViewResume(candidate, e)}
                                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                                    candidate.resumePath || candidate.googleDriveViewLink
                                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={candidate.resumePath || candidate.googleDriveViewLink ? "View Resume" : "No Resume Available"}
                                  disabled={!candidate.resumePath && !candidate.googleDriveViewLink}
                                >
                                  <FileText size={14} />
                                  Resume
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Page</span>
                            <input
                              key={currentPage}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              defaultValue={currentPage}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const page = parseInt(e.target.value);
                                  if (page >= 1 && page <= totalPages) {
                                    setCurrentPage(page);
                                  } else {
                                    e.target.value = currentPage;
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const page = parseInt(e.target.value);
                                if (page >= 1 && page <= totalPages && page !== currentPage) {
                                  setCurrentPage(page);
                                } else {
                                  e.target.value = currentPage;
                                }
                              }}
                              className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Page"
                            />
                            <span className="text-sm text-gray-500">of {totalPages}</span>
                          </div>
                          
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={goToPreviousPage}
                              disabled={currentPage === 1}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                              <ChevronLeft size={18} />
                              Previous
                            </button>
                            <button
                              onClick={goToNextPage}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
                            >
                              Next
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CANDIDATE DETAILS MODAL */}
        {showCandidateDetails && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Candidate Profile</h3>
                    <p className="text-gray-500 text-sm">Complete details of {selectedCandidate.name}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCandidateDetails(false);
                      setSelectedCandidate(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Candidate Details */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <UserCircle size={18} />
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <User size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="font-medium">{selectedCandidate.name}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Mail size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium">{selectedCandidate.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Mobile</p>
                          <p className="font-medium">{selectedCandidate.mobile}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-green-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <Briefcase size={18} />
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Building2 size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Current Organization</p>
                          <p className="font-medium">{selectedCandidate.currentOrg || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Award size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Experience</p>
                          <p className="font-medium">{selectedCandidate.experience || "N/A"} years</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Current CTC</p>
                          <p className="font-medium">{selectedCandidate.currentCTC || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Expected CTC</p>
                          <p className="font-medium">{selectedCandidate.expectedCTC || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Notice Period</p>
                          <p className="font-medium">{selectedCandidate.noticePeriod || "N/A"}</p>
                        </div>
                      </div>
{/* In the Professional Information section of candidate details modal */}
<div className="flex items-start gap-2">
  <Globe size={16} className="text-gray-500 mt-1 flex-shrink-0" />
  <div>
    <p className="text-xs text-gray-500">Visa Type</p>
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium mt-1 ${
      selectedCandidate.visaType === "China" 
        ? "bg-blue-100 text-blue-800"  // China - Blue
        : selectedCandidate.visaType === "NA" 
          ? "bg-gray-100 text-gray-800"
          : "bg-red-100 text-red-800"   // All other visa types - Red
    }`}>
      {selectedCandidate.visaType || "NA"}
    </span>
  </div>
</div>
                    </div>
                  </div>

                  {/* Sourcing Information */}
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                      <FileCheck size={18} />
                      Sourcing Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <User size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Profile Sourced By</p>
                          <p className="font-medium">{selectedCandidate.profileSourcedBy || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building2 size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Client Name</p>
                          <p className="font-medium">{selectedCandidate.clientName || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarDays size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Profile Submission Date</p>
                          <p className="font-medium">{formatDate(selectedCandidate.profileSubmissionDate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Skills */}
<div className="bg-yellow-50 p-4 rounded-xl">
  <h4 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
    <Code size={18} />
    Key Skills
  </h4>
  {(() => {
    let skillsArray = parseKeySkills(selectedCandidate.keySkills);
    skillsArray = skillsArray.map(skill => 
      typeof skill === 'string' ? skill.replace(/["']/g, '').trim() : skill
    ).filter(skill => skill);
    
    if (skillsArray.length > 0) {
      return (
        <p className="text-gray-700">
          {skillsArray.join(', ')}
        </p>
      );
    } else {
      return <p className="text-gray-500">No skills listed</p>;
    }
  })()}
</div>

                  {/* Resume & Actions */}
                  <div className="flex gap-3 justify-end mt-4">
                    {selectedCandidate.resumePath && (
                      <button
                        onClick={() => {
                          setSelectedResumeUrl(`http://localhost:5000${selectedCandidate.resumePath}`);
                          setShowResumeModal(true);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                      >
                        <FileText size={16} />
                        View Resume
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowCandidateDetails(false);
                        setSelectedCandidate(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RESUME MODAL */}
        {showResumeModal && selectedResumeUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh]">
              <div className="p-4 flex justify-between items-center border-b">
                <h3 className="text-xl font-bold">Resume Viewer</h3>
                <button
                  onClick={() => {
                    setShowResumeModal(false);
                    setSelectedResumeUrl(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="h-[calc(80vh-80px)]">
                {selectedResumeUrl.includes('drive.google.com') ? (
                  <iframe
                    src={selectedResumeUrl}
                    className="w-full h-full"
                    title="Resume Viewer"
                    allow="autoplay"
                  />
                ) : (
                  <iframe
                    src={selectedResumeUrl}
                    className="w-full h-full"
                    title="Resume Viewer"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* SEARCH FILTER POPUP */}
        {showSearchPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-bold">Search Filters</h3>
                    <p className="text-gray-500 text-sm">Type and select skills (use comma for multiple)</p>
                  </div>
                  <button
                    onClick={() => setShowSearchPopup(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Primary Skills Filter */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">
                      Primary Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={primarySkillInput}
                      onChange={handlePrimarySkillInputChange}
                      onKeyDown={handlePrimarySkillKeyDown}
                      placeholder="e.g., Python, Java, React"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Primary Skills Suggestions Dropdown */}
                    {showPrimarySuggestions && filteredPrimarySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredPrimarySuggestions.map((skill, index) => (
                          <div
                            key={`primary-suggestion-${skill}`}
                            onClick={() => {
                              selectPrimarySkill(skill);
                            }}
                            className={`px-3 py-2 cursor-pointer text-sm ${
                              index === selectedPrimarySuggestionIndex 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'hover:bg-blue-50'
                            }`}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Secondary Skills Filter */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-2">
                      Secondary Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={secondarySkillInput}
                      onChange={handleSecondarySkillInputChange}
                      onKeyDown={handleSecondarySkillKeyDown}
                      placeholder="e.g., AWS, Docker, Kubernetes"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Secondary Skills Suggestions Dropdown */}
                    {showSecondarySuggestions && filteredSecondarySuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredSecondarySuggestions.map((skill, index) => (
                          <div
                            key={`secondary-suggestion-${skill}`}
                            onClick={() => {
                              selectSecondarySkill(skill);
                            }}
                            className={`px-3 py-2 cursor-pointer text-sm ${
                              index === selectedSecondarySuggestionIndex 
                                ? 'bg-green-100 text-green-700' 
                                : 'hover:bg-green-50'
                            }`}
                          >
                            {skill}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Experience Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Experience Range (years)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="number"
                          name="experienceMin"
                          value={searchFilters.experienceMin}
                          onChange={handleSearchFilterChange}
                          placeholder="Min"
                          min="0"
                          step="0.5"
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
                          step="0.5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    onClick={resetSearchFilters}
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
                      {/* Client Name */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Client Name</label>
                        <input
                          type="text"
                          name="clientName"
                          value={newProfile.clientName}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Broadcom"
                        />
                      </div>

                      {/* Current Organization */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Current Organization</label>
                        <input
                          type="text"
                          name="currentOrg"
                          value={newProfile.currentOrg}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Tech Mahindra"
                        />
                      </div>

                      {/* Candidate Name */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Candidate Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={newProfile.name}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.name ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter full name"
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Experience */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Experience</label>
                        <input
                          type="text"
                          name="experience"
                          value={newProfile.experience}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 5 years"
                        />
                      </div>

                      {/* Current CTC */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Current CTC</label>
                        <input
                          type="text"
                          name="currentCTC"
                          value={newProfile.currentCTC}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 12LPA"
                        />
                      </div>

                      {/* Expected CTC */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Expected CTC</label>
                        <input
                          type="text"
                          name="expectedCTC"
                          value={newProfile.expectedCTC}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 18LPA"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Second Row - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Left Column of Second Row */}
                    <div className="space-y-4">
                      {/* Notice Period */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Notice Period</label>
                        <input
                          type="text"
                          name="noticePeriod"
                          value={newProfile.noticePeriod}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 2 months"
                        />
                      </div>

{/* Mobile Number */}
<div>
  <label className="block text-sm font-medium mb-1">
    Mobile Number <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    name="mobile"
    value={newProfile.mobile}
    onChange={(e) => {
      let value = e.target.value;
      // Remove all non-digit characters
      let digitsOnly = value.replace(/\D/g, '');
      
      // Allow up to 11 digits (supporting India - 10, China - 11, etc.)
      if (digitsOnly.length > 11) {
        digitsOnly = digitsOnly.slice(0, 11);
      }
      
      // Store the digits
      setNewProfile(prev => ({ ...prev, mobile: digitsOnly }));
      
      // Validation - allow 10 or 11 digits
      if (digitsOnly.length === 10 || digitsOnly.length === 11) {
        setFormErrors(prev => ({ ...prev, mobile: null }));
      } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        setFormErrors(prev => ({ ...prev, mobile: `Mobile number must be 10 or 11 digits (currently ${digitsOnly.length})` }));
      } else if (digitsOnly.length > 11) {
        setFormErrors(prev => ({ ...prev, mobile: "Mobile number cannot exceed 11 digits" }));
      } else {
        setFormErrors(prev => ({ ...prev, mobile: null }));
      }
    }}
    onKeyPress={(e) => {
      // Get current digits count
      const currentDigits = newProfile.mobile.replace(/\D/g, '');
      
      // If already 11 digits, prevent typing any more numbers
      if (currentDigits.length >= 11 && /[0-9]/.test(e.key)) {
        e.preventDefault();
        return;
      }
      
      // Allow only numbers
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    }}
    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
      formErrors.mobile ? 'border-red-500' : 'border-gray-300'
    }`}
    placeholder="Enter mobile number"
  />
  {formErrors.mobile && (
    <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
  )}
  <p className="text-xs text-gray-400 mt-1">Only numbers allowed, 10 digits (India) or 11 digits (China,USA)</p>
  {newProfile.mobile && (newProfile.mobile.length === 10 || newProfile.mobile.length === 11) && (
    <p className="text-xs text-green-600 mt-1">
      Valid {newProfile.mobile.length}-digit number
    </p>
  )}
</div>
                    </div>

                    {/* Right Column of Second Row */}
                    <div className="space-y-4">
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={newProfile.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>

                      {/* Profile Sourced By */}
                      <div>
                        <label className="block text-sm font-medium mb-1">Profile Sourced By</label>
                        <input
                          type="text"
                          name="profileSourcedBy"
                          value={newProfile.profileSourcedBy}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Swathi - Linkedin"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Third Row - Two Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Left Column of Third Row */}
                    <div className="space-y-4">
{/* Visa Type */}
<div>
  <label className="block text-sm font-medium mb-1">Visa Type</label>
  <select
    name="visaType"
    value={newProfile.visaType}
    onChange={handleInputChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    disabled={visaTypesLoading}
  >
    {visaTypesLoading ? (
      <option>Loading visa types...</option>
    ) : (
      visaTypes.map(type => (
        <option key={type} value={type}>
          {type}
        </option>
      ))
    )}
  </select>
  {visaTypesLoading && (
    <p className="text-xs text-gray-500 mt-1">Loading visa types...</p>
  )}
</div>
                    </div>

                    {/* Right Column of Third Row */}
                    <div className="space-y-4">
{/* Profile Submission Date - with DatePicker */}
<div>
  <label className="block text-sm font-medium mb-1">
    Profile Submission Date <span className="text-gray-500 text-xs">(defaults to today)</span>
    {userRole !== 'Admin' && (
      <span className="ml-2 text-xs text-blue-600">(Auto-set to today - not editable)</span>
    )}
  </label>
  <div className="w-full">
    <DatePicker
      selected={profileSubmissionDate}
      onChange={(date) => {
        // Only allow date changes for Admin users
        if (userRole === 'Admin') {
          setProfileSubmissionDate(date);
        }
      }}
      dateFormat="dd-MMM-yy"
      placeholderText={userRole === 'Admin' ? "Select date" : "Auto-set to today"}
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        userRole !== 'Admin' 
          ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
          : 'border-gray-300'
      }`}
      maxDate={new Date()}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      wrapperClassName="w-full"
      disabled={userRole !== 'Admin'}
      readOnly={userRole !== 'Admin'}
    />
  </div>
  <p className="text-xs text-gray-500 mt-1">
    {userRole !== 'Admin' 
      ? `📅 Profile will be recorded with today's date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}`
      : profileSubmissionDate 
        ? `Selected: ${profileSubmissionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}` 
        : 'Leave empty to use today\'s date'}
  </p>
</div>
                    </div>
                  </div>

                 {/* Key Skills */}
<div className="mt-6 w-full">
  <label className="block text-sm font-medium mb-2">
    Key Skills <span className="text-red-500">*</span>
  </label>
  
  {/* Skill Input with Suggestions and Tags Inside */}
  <div className="relative w-full">
    <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]">
      {/* Display selected skills as clean tags without quotes */}
      {newProfile.keySkills.map((skill, index) => (
        <span
          key={`skill-tag-${index}`}
          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
        >
          {/* Show skill without quotes */}
          {skill.replace(/["']/g, '')}
          <button
            type="button"
            onClick={() => handleRemoveSkill(skill)}
            className="hover:text-blue-600 focus:outline-none"
          >
            <X size={14} />
          </button>
        </span>
      ))}
      
      {/* Input field for new skills */}
      <input
        type="text"
        value={skillInput}
        onChange={handleAddSkillInputChange}
        onKeyDown={handleAddSkillKeyDown}
        placeholder={newProfile.keySkills.length === 0 ? "Enter a skill and press Enter" : ""}
        className="flex-1 min-w-[150px] outline-none bg-transparent"
      />
    </div>
    
    {/* Add Button */}
    <button
      type="button"
      onClick={() => {
        if (skillInput.trim()) {
          handleAddSkillToProfile();
        }
      }}
      disabled={!skillInput.trim()}
      className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      Add
    </button>
    
    {/* Add Skill Suggestions Dropdown */}
    {showAddSkillSuggestions && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
        {filteredAddSkillSuggestions.length > 0 ? (
          filteredAddSkillSuggestions.map((skill, index) => (
            <div
              key={`add-skill-suggestion-${skill}`}
              onClick={() => {
                handleAddSkillToProfile(skill);
              }}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === selectedAddSkillSuggestionIndex 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'hover:bg-blue-50'
              }`}
            >
              {skill}
            </div>
          ))
        ) : (
          <div className="px-3 py-4 text-center">
            <p className="text-sm text-red-500 font-medium mb-2">
              ✗ "{skillInput.trim()}" is not available
            </p>
            <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
              <span className="font-semibold">Only these skills can be added:</span><br />
              {skillSuggestions.slice(0, 5).join(', ')}
              {skillSuggestions.length > 5 && '...'}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Please select from the existing skills
            </p>
          </div>
        )}
      </div>
    )}
  </div>

  {/* Skills Error */}
  {formErrors.keySkills && (
    <p className="text-red-500 text-xs mt-2">{formErrors.keySkills}</p>
  )}
</div>

                  {/* PDF Upload */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2">Upload Resume (PDF)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                          <input
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={handlePdfUpload}
                            className="hidden"
                          />
                          <Upload className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-1 text-sm text-gray-500">
                            {pdfFile ? pdfFile.name : "Click to upload PDF"}
                          </p>
                        </div>
                      </label>
                      {pdfFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setPdfFile(null);
                            setNewProfile(prev => ({ ...prev, resumePdf: null }));
                          }}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end mt-8">
                    <button
                      type="button"
                      onClick={() => setShowAddProfile(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      disabled={submitLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

     {/* EDIT PROFILE MODAL */}
{showEditModal && editingCandidate && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
      <div className="p-6">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold">Edit Candidate Profile</h3>
            <p className="text-gray-500 text-sm">
              {userRole === 'Admin' 
                ? '🔓 Full access - you can edit all fields' 
                : '🔒 Limited access - CTC and Sourcing fields are restricted (Contact Admin)'}
            </p>
          </div>
          <button
            onClick={() => {
              setShowEditModal(false);
              setEditingCandidate(null);
              setEditFormData({
                name: "",
                email: "",
                mobile: "",
                experience: "",
                currentOrg: "",
                currentCTC: "",
                expectedCTC: "",
                noticePeriod: "",
                profileSourcedBy: "",
                clientName: "",
                profileSubmissionDate: "",
                keySkills: [],
                visaType: "NA",
                resumePdf: null
              });
              setEditSkillInput("");
              setEditPdfFile(null);
              setEditFormErrors({});
            }}
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
        {editFormErrors.submit && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {editFormErrors.submit}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }}>
          {/* FIRST ROW - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Client Name - Editable by both */}
              <div>
                <label className="block text-sm font-medium mb-1">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={editFormData.clientName}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Broadcom"
                />
              </div>

              {/* Candidate Name - Editable by both */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Candidate Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={editFormData.name}
                  onChange={handleEditInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editFormErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {editFormErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{editFormErrors.name}</p>
                )}
              </div>

              {/* Email - Editable by both */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={editFormData.email}
                  onChange={handleEditInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editFormErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {editFormErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{editFormErrors.email}</p>
                )}
              </div>

{/* Mobile Number */}
<div>
  <label className="block text-sm font-medium mb-1">
    Mobile Number <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    name="mobile"
    value={editFormData.mobile}
    onChange={(e) => {
      let value = e.target.value;
      // Remove all non-digit characters
      let digitsOnly = value.replace(/\D/g, '');
      
      // Allow up to 11 digits (supporting India - 10, China - 11, etc.)
      if (digitsOnly.length > 11) {
        digitsOnly = digitsOnly.slice(0, 11);
      }
      
      // Store the digits
      setEditFormData(prev => ({ ...prev, mobile: digitsOnly }));
      
      // Validation - allow 10 or 11 digits
      if (digitsOnly.length === 10 || digitsOnly.length === 11) {
        setEditFormErrors(prev => ({ ...prev, mobile: null }));
      } else if (digitsOnly.length > 0 && digitsOnly.length < 10) {
        setEditFormErrors(prev => ({ ...prev, mobile: `Mobile number must be 10 or 11 digits (currently ${digitsOnly.length})` }));
      } else if (digitsOnly.length > 11) {
        setEditFormErrors(prev => ({ ...prev, mobile: "Mobile number cannot exceed 11 digits" }));
      } else {
        setEditFormErrors(prev => ({ ...prev, mobile: null }));
      }
    }}
    onKeyPress={(e) => {
      // Get current digits count
      const currentDigits = editFormData.mobile.replace(/\D/g, '');
      
      // If already 11 digits, prevent typing any more numbers
      if (currentDigits.length >= 11 && /[0-9]/.test(e.key)) {
        e.preventDefault();
        return;
      }
      
      // Allow only numbers
      if (!/[0-9]/.test(e.key)) {
        e.preventDefault();
      }
    }}
    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
      editFormErrors.mobile ? 'border-red-500' : 'border-gray-300'
    }`}
    placeholder="Enter mobile number (10 or 11 digits)"
  />
  {editFormErrors.mobile && (
    <p className="text-red-500 text-xs mt-1">{editFormErrors.mobile}</p>
  )}
  <p className="text-xs text-gray-400 mt-1">Only numbers allowed, 10 digits (India) or 11 digits (China,USA)</p>
  {editFormData.mobile && (editFormData.mobile.length === 10 || editFormData.mobile.length === 11) && (
    <p className="text-xs text-green-600 mt-1">
      Valid {editFormData.mobile.length}-digit number
    </p>
  )}
</div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Current Organization - Editable by both */}
              <div>
                <label className="block text-sm font-medium mb-1">Current Organization</label>
                <input
                  type="text"
                  name="currentOrg"
                  value={editFormData.currentOrg}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Tech Mahindra"
                />
              </div>

              {/* Experience - Editable by both */}
              <div>
                <label className="block text-sm font-medium mb-1">Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={editFormData.experience}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 5 years"
                />
              </div>

              {/* Current CTC - RESTRICTED: Only Admin can edit */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current CTC
                  {userRole !== 'Admin' && (
                    <span className="ml-2 text-xs text-red-500">(Contact Admin)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="currentCTC"
                  value={editFormData.currentCTC}
                  onChange={handleEditInputChange}
                  disabled={userRole !== 'Admin'}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    userRole !== 'Admin' 
                      ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., 12LPA"
                  title={userRole !== 'Admin' ? 'Only Admin can edit this field' : ''}
                />
               
              </div>

              {/* Expected CTC - RESTRICTED: Only Admin can edit */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Expected CTC
                  {userRole !== 'Admin' && (
                    <span className="ml-2 text-xs text-red-500">(Contact Admin)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="expectedCTC"
                  value={editFormData.expectedCTC}
                  onChange={handleEditInputChange}
                  disabled={userRole !== 'Admin'}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    userRole !== 'Admin' 
                      ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., 18LPA"
                  title={userRole !== 'Admin' ? 'Only Admin can edit this field' : ''}
                />
               
              </div>
            </div>
          </div>

          {/* SECOND ROW - Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Left Column of Second Row */}
            <div className="space-y-4">
              {/* Notice Period - Editable by both */}
              <div>
                <label className="block text-sm font-medium mb-1">Notice Period</label>
                <input
                  type="text"
                  name="noticePeriod"
                  value={editFormData.noticePeriod}
                  onChange={handleEditInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2 months"
                />
              </div>

              {/* Profile Sourced By - RESTRICTED: Only Admin can edit */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Profile Sourced By
                  {userRole !== 'Admin' && (
                    <span className="ml-2 text-xs text-red-500">(Contact Admin)</span>
                  )}
                </label>
                <input
                  type="text"
                  name="profileSourcedBy"
                  value={editFormData.profileSourcedBy}
                  onChange={handleEditInputChange}
                  disabled={userRole !== 'Admin'}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    userRole !== 'Admin' 
                      ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
                      : 'border-gray-300'
                  }`}
                  placeholder="e.g., Swathi - Linkedin"
                  title={userRole !== 'Admin' ? 'Only Admin can edit this field' : ''}
                />
               
              </div>

{/* Visa Type - Editable by both */}
<div>
  <label className="block text-sm font-medium mb-1">Visa Type</label>
  <select
    name="visaType"
    value={editFormData.visaType}
    onChange={handleEditInputChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    disabled={visaTypesLoading}
  >
    {visaTypesLoading ? (
      <option>Loading visa types...</option>
    ) : (
      visaTypes.map(type => (
        <option key={type} value={type}>
          {type}
        </option>
      ))
    )}
  </select>
</div>
            </div>

            {/* Right Column of Second Row */}
            <div className="space-y-4">
             {/* Profile Submission Date - Editable by both */}
<div>
  <label className="block text-sm font-medium mb-1">
    Profile Submission Date
    {userRole !== 'Admin' && (
      <span className="ml-2 text-xs text-red-500">(Contact admin)</span>
    )}
  </label>
  <div className="w-full">
    <DatePicker
      selected={editProfileSubmissionDate}
      onChange={(date) => setEditProfileSubmissionDate(date)}
      dateFormat="dd-MMM-yy"
      placeholderText="Select date"
      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        userRole !== 'Admin' 
          ? 'bg-gray-100 cursor-not-allowed border-gray-200' 
          : 'border-gray-300'
      }`}
      maxDate={new Date()}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      wrapperClassName="w-full"
      disabled={userRole !== 'Admin'} // Disable for non-admin users
    />
  </div>
  <p className="text-xs text-gray-500 mt-1">
    {userRole !== 'Admin' 
      ? "" 
      : editProfileSubmissionDate 
        ? `Selected: ${editProfileSubmissionDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}` 
        : 'Keep existing date if not changed'}
  </p>
</div>
            </div>
          </div>

          {/* Key Skills Section - Full Width (Editable by both) */}
          <div className="mt-6 w-full">
            <label className="block text-sm font-medium mb-2">
              Key Skills <span className="text-red-500">*</span>
            </label>
            
            {/* Skill Input with Suggestions and Tags Inside */}
            <div className="relative w-full">
              <div className="flex flex-wrap items-center gap-1 p-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]">
                {/* Display selected skills as tags inside the input */}
                {editFormData.keySkills.map((skill, index) => (
                  <span
                    key={`edit-skill-tag-${index}`}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleEditSkillRemove(skill)}
                      className="hover:text-blue-600 focus:outline-none"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
                
                {/* Input field for new skills */}
                <input
                  type="text"
                  value={editSkillInput}
                  onChange={handleEditSkillInputChange}
                  onKeyDown={handleEditSkillKeyDown}
                  placeholder={editFormData.keySkills.length === 0 ? "Enter a skill and press Enter (use comma for multiple)" : ""}
                  className="flex-1 min-w-[150px] outline-none bg-transparent"
                />
              </div>
              
             {/* Add Button in Edit Modal */}
<button
  type="button"
  onClick={() => {
    if (editSkillInput.trim()) {
      handleEditSkillAdd();  // Now adds as single skill
    }
  }}
  disabled={!editSkillInput.trim()}
  className="absolute right-2 top-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
>
  Add
</button>
              
              {/* Edit Skill Suggestions Dropdown */}
              {showEditSkillSuggestions && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredEditSkillSuggestions.length > 0 ? (
                    filteredEditSkillSuggestions.map((skill, index) => (
                      <div
                        key={`edit-skill-suggestion-${skill}`}
                        onClick={() => {
                          handleEditSkillAdd(skill);
                        }}
                        className={`px-3 py-2 cursor-pointer text-sm ${
                          index === selectedEditSkillSuggestionIndex 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'hover:bg-blue-50'
                        }`}
                      >
                        {skill}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        "{editSkillInput.split(',').pop().trim()}" is not in the skills list
                      </p>
                      <p className="text-xs text-gray-400">
                        Only skills from the database can be added
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Skills Error */}
            {editFormErrors.keySkills && (
              <p className="text-red-500 text-xs mt-2">{editFormErrors.keySkills}</p>
            )}
          </div>

          {/* PDF Upload Section (Editable by both) */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Upload Resume (PDF)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleEditPdfUpload}
                    className="hidden"
                  />
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-sm text-gray-500">
                    {editPdfFile ? editPdfFile.name : editingCandidate?.resumePath ? "Replace existing resume" : "Click to upload PDF"}
                  </p>
                </div>
              </label>
              {editPdfFile && (
                <button
                  type="button"
                  onClick={() => {
                    setEditPdfFile(null);
                    setEditFormData(prev => ({ ...prev, resumePdf: null }));
                  }}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-8">
            <button
              type="button"
              onClick={() => {
                setShowEditModal(false);
                setEditingCandidate(null);
                setEditFormData({
                  name: "",
                  email: "",
                  mobile: "",
                  experience: "",
                  currentOrg: "",
                  currentCTC: "",
                  expectedCTC: "",
                  noticePeriod: "",
                  profileSourcedBy: "",
                  clientName: "",
                  profileSubmissionDate: "",
                  keySkills: [],
                  visaType: "NA",
                  resumePdf: null
                });
                setEditSkillInput("");
                setEditPdfFile(null);
                setEditFormErrors({});
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={editLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {editLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-red-600">Confirm Delete</h3>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingCandidateId(null);
                      setDeletingCandidateName("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete <span className="font-bold">{deletingCandidateName}</span>'s profile?
                  </p>
                  <p className="text-sm text-gray-500 mt-2">This action cannot be undone.</p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingCandidateId(null);
                      setDeletingCandidateName("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleteLoading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deleteLoading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recruiter;
