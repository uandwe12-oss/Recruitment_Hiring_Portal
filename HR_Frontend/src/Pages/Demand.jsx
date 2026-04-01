import React, { useState, useEffect } from "react";
import Header from "../components/Header"
import bgImage from "../assets/Images/back.png";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import axios from "axios"; // Add axios import

import {
  X,
  Pencil,
  Briefcase,
  MapPin,
  User,
  Flame,
  CheckCircle,
  Search,
  Flag,
  Calendar,
  GraduationCap,
  // UserCheck,
  Save,
  Trash2,
  MessageCircle,//
  Users,
  Eye,
  Mail,
  Phone,
  FileText,
  Loader,
  Clock,  // ← Add this line
  XCircle, // ← Add this if not already present
  UserCheck // ← Already present but good to check
} from "lucide-react";

const Demand = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("active");
  const [selectedDemand, setSelectedDemand] = useState(null);
  const [demands, setDemands] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDemand, setEditedDemand] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newDemand, setNewDemand] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userRole, setUserRole] = useState(null);
  const [userClientName, setUserClientName] = useState(null);
  const [statusChangeDesc, setStatusChangeDesc] = useState("");
  const [showStatusDesc, setShowStatusDesc] = useState(false);
  const [previousStatus, setPreviousStatus] = useState("");
  // Status Edit Modal States
  const [showStatusEditModal, setShowStatusEditModal] = useState(false);
  const [selectedStatusCandidate, setSelectedStatusCandidate] = useState(null);
  const [selectedNewStatus, setSelectedNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryCandidate, setSelectedHistoryCandidate] = useState(null);

  // Selected Candidates States
  const [selectedCandidates, setSelectedCandidates] = useState({});
  const [showSelectedModal, setShowSelectedModal] = useState(false);
  const [currentSelectedCandidates, setCurrentSelectedCandidates] = useState([]);
  const [selectedDemandId, setSelectedDemandId] = useState(null);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [selectedDemandDetails, setSelectedDemandDetails] = useState(null);


  const formDemand = isAdding
    ? newDemand
    : isEditing
      ? editedDemand
      : selectedDemand;

  const navigate = useNavigate();

useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    setUserRole(user.role);
    // Store client name for Interviewer
    if (user.role === "Interviewer" && user.clientName) {
      setUserClientName(user.clientName);
      console.log(`👤 Interviewer logged in - Client: ${user.clientName}`);
    }
    // Store client name for Recruiter if needed
    if (user.role === "Recruiter" && user.clientName) {
      setUserClientName(user.clientName);
      console.log(`👤 Recruiter logged in - Client: ${user.clientName}`);
    }
    // Store client name for Client Interviewer
    if (user.role === "Client Interviewer" && user.clientName) {
      setUserClientName(user.clientName);
      console.log(`👤 Client Interviewer logged in - Client: ${user.clientName}`);
    }
  }
}, []);

  const fetchDemands = async () => {
    try {
      const response = await fetch("https://myuandwe-bg.vercel.app/api/demand");
      if (!response.ok) throw new Error("Failed to fetch demands");
      const data = await response.json();
      setDemands(data);

      // After fetching demands, load selected candidates for each demand
      await loadAllSelectedCandidates(data);
    } catch (err) {
      console.error("❌ Error fetching demands:", err);
    }
  };

  // Function to fetch selected candidates for a specific demand
  const fetchSelectedCandidates = async (demandId) => {
    try {
      const response = await axios.get(`https://myuandwe-bg.vercel.app/api/selected-candidates/${demandId}`);

      if (response.data.success) {
        console.log(`✅ Fetched ${response.data.data.length} selected candidates for demand ${demandId}`);
        return response.data.data;
      }
      return [];
    } catch (err) {
      console.error(`❌ Error fetching selected candidates for demand ${demandId}:`, err);
      return [];
    }
  };

  // Function to load selected candidates for all demands
  const loadAllSelectedCandidates = async (demandsList) => {
    try {
      const selections = {};

      // Fetch selected candidates for each demand in parallel
      await Promise.all(
        demandsList.map(async (demand) => {
          const candidates = await fetchSelectedCandidates(demand.id);
          selections[demand.id] = candidates;
        })
      );

      setSelectedCandidates(selections);
    } catch (err) {
      console.error("❌ Error loading all selected candidates:", err);
    }
  };
  const openStatusEditModal = (candidate) => {
    setSelectedStatusCandidate(candidate);
    setSelectedNewStatus(''); // Don't pre-select current status
    setStatusReason('');
    setShowStatusEditModal(true);
  };

  // View candidate history - Modified to include demand details
  const viewCandidateHistory = (candidate) => {
    // Find the current demand details from selectedDemandDetails
    // If selectedDemandDetails exists, use its rrNumber, otherwise fallback to ID
    setSelectedHistoryCandidate({
      ...candidate,
      demandRrNumber: selectedDemandDetails?.rrNumber || `RR${String(selectedDemandId).padStart(3, "0")}`
    });
    setShowHistoryModal(true);
  };

  const handleStatusUpdate = async () => {
    // Get the current values directly from state
    const currentStatus = selectedNewStatus;
    const currentReason = statusReason;
    const currentCandidate = selectedStatusCandidate;
    const currentDemandId = selectedDemandId;

    console.log("🔍 handleStatusUpdate called");
    console.log("Current status from state:", currentStatus);
    console.log("Current candidate:", currentCandidate);

    if (!currentStatus || !currentReason.trim() || !currentCandidate) return;

    try {
      setStatusLoading(true);

      const user = JSON.parse(localStorage.getItem("user")) || {};
      const changedBy = user.name || user.username || 'Unknown';

      const requestBody = {
        candidateId: currentCandidate.id,
        demandId: currentDemandId,
        status: currentStatus,
        reason: currentReason,
        changedBy: changedBy
      };

      console.log("Sending PUT request with body:", requestBody);

      const response = await axios.put(`https://myuandwe-bg.vercel.app/api/selected-candidates/status`, requestBody);

      console.log("Response from server:", response.data);

      if (response.data.success) {
        console.log("✅ Status update successful, refreshing candidates...");

        const updatedCandidates = await fetchSelectedCandidates(currentDemandId);
        setCurrentSelectedCandidates(updatedCandidates);
        setSelectedCandidates(prev => ({
          ...prev,
          [currentDemandId]: updatedCandidates
        }));

        setShowStatusEditModal(false);
        setSelectedStatusCandidate(null);
        setSelectedNewStatus('');
        setStatusReason('');

      } else {
        console.error("❌ Update failed - response success false");
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  // Handle candidate status change with reason
  const handleCandidateAction = async (candidateId, newStatus, reason) => {
    try {
      setLoadingSelected(true);

      // Get current user
      const user = JSON.parse(localStorage.getItem("user")) || {};
      const changedBy = user.name || user.username || 'Unknown';

      const response = await axios.put(`https://myuandwe-bg.vercel.app/api/selected-candidates/status`, {
        candidateId: candidateId,
        demandId: selectedDemandId,
        status: newStatus,
        reason: reason,
        changedBy: changedBy
      });

      if (response.data.success) {
        // Refresh the selected candidates list
        const updatedCandidates = await fetchSelectedCandidates(selectedDemandId);
        setCurrentSelectedCandidates(updatedCandidates);

        // Also update the main selectedCandidates state
        setSelectedCandidates(prev => ({
          ...prev,
          [selectedDemandId]: updatedCandidates
        }));

        // Show success message
        //alert(`Candidate marked as ${newStatus}!`);
      }
    } catch (err) {
      console.error(`Error updating candidate status:`, err);
      alert('Failed to update candidate status');
    } finally {
      setLoadingSelected(false);
    }
  };
  // Function to view selected candidates for a demand
  const handleViewSelectedCandidates = async (demand) => {
    setSelectedDemandId(demand.id);
    setSelectedDemandDetails(demand);
    setCurrentSelectedCandidates([]);
    setShowSelectedModal(true);
    setLoadingSelected(true);

    // Fetch selected candidates
    const candidates = await fetchSelectedCandidates(demand.id);
    setCurrentSelectedCandidates(candidates);
    setLoadingSelected(false);
  };

  const handleExport = () => {
    if (!demands.length) {
      return;
    }

    // Prepare data with separate columns for each field
    const exportData = demands.map((d, index) => {
      const ageingWeeks = d.ageingWeeks ?? calculateAgeing(d.createdDate);

      return {
        "S.No": index + 1,
        "RR No": d.rrNumber || `RR${String(d.id).padStart(3, "0")}`,
        "Client": d.clientName || "",
        "Experience": `${d.expFrom || 0}-${d.expTo || 0} yrs`,
        "Country": d.country || "",
        "Location": d.location || "",
        "Creation Date": d.createdDate || "",
        "Ageing in Weeks": ageingWeeks,
        "Priority": d.jobPriority || "",
        "Status": d.status || "",
        "Interviewer 1": d.interviewer1 || "",
        "Interviewer 2": d.interviewer2 || "",
        "Recruiter": d.recruiterPOC || "",
        "Primary Skills": (d.primarySkill || []).join(", "),
        "Secondary Skills": (d.secondarySkill || []).join(", "),
        "Job Description": d.jobDescription || "",
        "Selected Candidates": selectedCandidates[d.id]?.length || 0
      };
    });

    // Create worksheet with the data
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 5 },    // S.No
      { wch: 10 },   // RR No
      { wch: 20 },   // Client
      { wch: 15 },   // Experience
      { wch: 15 },   // Country
      { wch: 15 },   // Location
      { wch: 12 },   // Creation Date
      { wch: 15 },   // Ageing in Weeks
      { wch: 10 },   // Priority
      { wch: 10 },   // Status
      { wch: 15 },   // Interviewer 1
      { wch: 15 },   // Interviewer 2
      { wch: 15 },   // Recruiter
      { wch: 30 },   // Primary Skills
      { wch: 30 },   // Secondary Skills
      { wch: 50 },   // Job Description
      { wch: 15 }    // Selected Candidates
    ];

    worksheet['!cols'] = columnWidths;

    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Demands");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(fileData, `Demand_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleCreateDemand = async () => {
    try {
      setIsSaving(true);

      // Prepare the data for new demand
      const demandToCreate = {
        clientName: newDemand.clientName || "",
        country: newDemand.country || "",
        createdDate: newDemand.createdDate || new Date().toISOString().split('T')[0],
        expFrom: newDemand.expFrom || 0,
        expTo: newDemand.expTo || 0,
        interviewer1: newDemand.interviewer1 || "",
        interviewer2: newDemand.interviewer2 || "",
        jobDescription: newDemand.jobDescription || "",
        jobPriority: newDemand.jobPriority || "Medium",
        location: newDemand.location || "",
        primarySkill: (newDemand.primarySkill || []).filter(skill => skill && skill.trim() !== ""),
        secondarySkill: (newDemand.secondarySkill || []).filter(skill => skill && skill.trim() !== ""),
        recruiterPOC: newDemand.recruiterPOC || "",
        status: newDemand.status || "Active"
      };

      console.log("📝 Sending demand data to backend:", demandToCreate);

      const response = await fetch("https://myuandwe-bg.vercel.app/api/demand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(demandToCreate),
      });

      console.log("📡 Response status:", response.status);

      const responseText = await response.text();
      console.log("📡 Response body:", responseText);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log("✅ Demand created successfully:", result);

      // Refresh the demands list
      await fetchDemands();

      // Close the popup
      setIsAdding(false);
      setNewDemand(null);

    } catch (err) {
      console.error("❌ Create error details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDemand = async (demandId) => {
    if (!window.confirm("Are you sure you want to delete this demand?")) {
      return;
    }

    try {
      const response = await fetch(`https://myuandwe-bg.vercel.app/api/demand/${demandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete demand");
      }

      // Refresh the demands list
      await fetchDemands();

      // Close the popup if the deleted demand was selected
      if (selectedDemand?.id === demandId) {
        setSelectedDemand(null);
      }

    } catch (err) {
      console.error("❌ Error deleting demand:", err);
    }
  };

  useEffect(() => {
    fetchDemands();
  }, []);

  // Reset to page 1 when search term or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  // 🔹 Calculate ageing dynamically
  const calculateAgeing = (createdDate) => {
    if (!createdDate) return 0;
    const created = new Date(createdDate);
    const today = new Date();
    const diffDays = Math.floor((today - created) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(diffDays / 7));
  };

  // First filter by status based on selection
// First filter by status based on selection
const statusFilteredDemands = demands.filter((d) => {
  // For Client Interviewer - ONLY show Active demands
  if (userRole === "Client Interviewer") {
    // Only show demands that are Active AND match their client
    return d.status === "Active" && d.clientName === userClientName;
  }

  // For other roles, apply status filter based on sortBy
  let statusMatch = true;
  if (sortBy === "active") {
    statusMatch = d.status === "Active";
  } else if (sortBy === "fulfilled") {
    statusMatch = d.status === "Fulfilled";
  } else if (sortBy === "closed") {
    statusMatch = d.status === "Closed";
  } else if (sortBy === "cancelled") {
    statusMatch = d.status === "Cancelled";
  } else if (sortBy === "all") {
    statusMatch = true;
  }

  // If status doesn't match, return false
  if (!statusMatch) return false;

  // Filter by client for Interviewer and Recruiter roles
  if ((userRole === "Interviewer" || userRole === "Recruiter") && userClientName) {
    return d.clientName === userClientName;
  }

  // Admin sees all demands
  return true;
});

  // Then apply search filter
  const filteredDemands = statusFilteredDemands.filter((d) =>
    `${d.clientName || ""} ${d.location || ""} ${(d.primarySkill || []).join(
      " "
    )} ${(d.secondarySkill || []).join(" ")}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const sortedDemands = [...filteredDemands].sort((a, b) => {
    if (sortBy === "priority") {
      // Priority order: High > Medium > Low
      const priorityOrder = { "High": 1, "Medium": 2, "Low": 3 };
      const aPriority = priorityOrder[a.jobPriority] || 4;
      const bPriority = priorityOrder[b.jobPriority] || 4;
      return aPriority - bPriority;
    }
    if (sortBy === "date") {
      return new Date(b.createdDate || 0) - new Date(a.createdDate || 0);
    }
    // For active/inactive views, sort by RR No/id
    return a.id - b.id;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedDemands.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedDemands.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleEditDemand = (demand) => {
    // Make sure we have the latest demand data
    const demandToEdit = demands.find(d => d.id === demand.id) || demand;

    setIsEditing(true);
    setEditedDemand({ ...demandToEdit });

    // Load the reason from statusHistory (now stored as a simple string)
    if (demandToEdit.statusHistory) {
      const historyStr = demandToEdit.statusHistory;
      if (typeof historyStr === 'string' && historyStr.trim() !== "") {
        // Extract just the reason part (remove the " (by User on date)" part)
        const reasonPart = historyStr.split(' (by')[0];
        setStatusChangeDesc(reasonPart);
        setShowStatusDesc(true);
      } else {
        setStatusChangeDesc("");
        setShowStatusDesc(false);
      }
    } else {
      setStatusChangeDesc("");
      setShowStatusDesc(false);
    }

    setPreviousStatus(demandToEdit.status || "Active");
  };

  const handleSaveDemand = async () => {
    // If we're in "add" mode, call create function
    if (isAdding && newDemand) {
      await handleCreateDemand();
      return;
    }

    // Check if status is being changed and no description provided
    if (!isAdding && editedDemand?.status !== previousStatus) {
      if (!statusChangeDesc.trim()) {
        alert("Please enter a reason for status change");
        return;
      }
    }

    // Otherwise, it's an edit
    if (!editedDemand?.id) return;

    try {
      setIsSaving(true);

      // Create the updated demand object
      const updatedDemand = { ...editedDemand };

      // Get current user
      const user = JSON.parse(localStorage.getItem("user")) || { name: "Unknown" };

      // Check if status has changed
      const statusChanged = previousStatus && previousStatus !== editedDemand.status;

      if (statusChanged) {
        // Status changed - store ONLY the reason as a simple string (not an array)
        const reasonText = statusChangeDesc.trim() || `Status changed from ${previousStatus} to ${editedDemand.status}`;

        // Store as a simple string with date and user info
        updatedDemand.statusHistory = `${reasonText} (by ${user.name || "Unknown"} on ${new Date().toLocaleString()})`;

        console.log("📝 Status changed - storing reason:", updatedDemand.statusHistory);
      } else if (statusChangeDesc !== "" && statusChangeDesc !== (() => {
        // Check if reason was updated without status change
        const currentHistory = updatedDemand.statusHistory;
        if (currentHistory && typeof currentHistory === 'string') {
          // Extract just the reason part (before the " (by" if it exists)
          const reasonPart = currentHistory.split(' (by')[0];
          return reasonPart;
        }
        return "";
      })()) {
        // Reason updated without status change - REPLACE with new reason
        const newReasonText = statusChangeDesc.trim();
        updatedDemand.statusHistory = `${newReasonText} (by ${user.name || "Unknown"} on ${new Date().toLocaleString()})`;
        console.log("📝 Reason updated - replacing with:", updatedDemand.statusHistory);
      }

      console.log("📝 Sending updated demand to backend:", JSON.stringify(updatedDemand, null, 2));

      const response = await fetch(
        `https://myuandwe-bg.vercel.app/api/demand/${editedDemand.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedDemand),
        }
      );

      const responseText = await response.text();
      console.log("📡 Response from server:", responseText);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      console.log("✅ Update successful:", result);

      // Refresh the demands list
      await fetchDemands();

      // Reset all edit-related states
      setIsEditing(false);
      setEditedDemand(null);
      setShowStatusDesc(false);
      setStatusChangeDesc("");
      setPreviousStatus("");

      // Close the popup
      setSelectedDemand(null);

    } catch (err) {
      console.error("❌ Error updating demand:", err);
      alert("Failed to update demand: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsAdding(false);
    setEditedDemand(null);
    setNewDemand(null);
    setShowStatusDesc(false);
    setStatusChangeDesc("");
    setPreviousStatus("");
    // Don't set selectedDemand to null here - keep it open in view mode
  };

  const handleInputChange = (field, value) => {
    if (isAdding) {
      setNewDemand(prev => ({
        ...prev,
        [field]: value
      }));
    } else if (isEditing) {
      setEditedDemand(prev => ({
        ...prev,
        [field]: value
      }));

      // Show reason input when status changes to non-Active
      if (field === "status" && value !== "Active" && value !== previousStatus) {
        setShowStatusDesc(true);
        // Don't clear existing reason when changing status
      } else if (field === "status" && value === "Active") {
        setShowStatusDesc(false);
        setStatusChangeDesc("");
      }
    }
  };

  const handleSkillChange = (type, index, value) => {
    if (isAdding) {
      setNewDemand(prev => ({
        ...prev,
        [type]: (prev[type] || []).map((skill, i) => i === index ? value : skill)
      }));
    } else if (isEditing) {
      setEditedDemand(prev => ({
        ...prev,
        [type]: prev[type].map((skill, i) => i === index ? value : skill)
      }));
    }
  };

  const handleAddSkill = (type) => {
    if (isAdding) {
      setNewDemand(prev => ({
        ...prev,
        [type]: [...(prev[type] || []), ""]
      }));
    } else if (isEditing) {
      setEditedDemand(prev => ({
        ...prev,
        [type]: [...prev[type], ""]
      }));
    }
  };

  const handleRemoveSkill = (type, index) => {
    if (isAdding) {
      setNewDemand(prev => ({
        ...prev,
        [type]: (prev[type] || []).filter((_, i) => i !== index)
      }));
    } else if (isEditing) {
      setEditedDemand(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  const handleViewCandidates = (demand) => {
    if (!demand || !demand.id) {
      return;
    }

    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem("user"));

    // Create a query string with the demand's requirements
    const queryParams = new URLSearchParams();

    // Add primary skills
    if (demand.primarySkill && demand.primarySkill.length > 0) {
      queryParams.append('primarySkills', demand.primarySkill.join(','));
    }

    // Add secondary skills
    if (demand.secondarySkill && demand.secondarySkill.length > 0) {
      queryParams.append('secondarySkills', demand.secondarySkill.join(','));
    }

    // Add experience range
    if (demand.expFrom) {
      queryParams.append('minExperience', demand.expFrom);
    }
    if (demand.expTo) {
      queryParams.append('maxExperience', demand.expTo);
    }

    // ✅ ADD THIS - Pass client name for Zone filtering
    if (demand.clientName) {
      queryParams.append('clientName', demand.clientName);
      console.log(`🔍 Filtering out candidates in Zone for client: ${demand.clientName}`);
    }

    // Add a flag to indicate we want to auto-apply filters
    queryParams.append('autoFilter', 'true');

    // Add demand ID
    queryParams.append('demandId', demand.id);

    // Add user info to maintain session
    if (user) {
      queryParams.append('userId', user.id);
      queryParams.append('userRole', user.role);
    }

    console.log("Navigating to recruiter with params:", queryParams.toString());

    // Navigate to recruiter page with query parameters
    navigate(`/recruiter?${queryParams.toString()}`);
  };

  const handleAddButtonClick = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    setIsAdding(true);
    setSelectedDemand(null);
    setIsEditing(false);
    setNewDemand({
      clientName: "",
      country: "",
      createdDate: new Date().toISOString().split("T")[0],
      expFrom: "",
      expTo: "",
      interviewer1: "",
      interviewer2: "",
      jobDescription: "",
      jobPriority: "Medium",
      location: "",
      primarySkill: [""],
      secondarySkill: [""],
      recruiterPOC: "",
      status: "Active",
      createdBy: user?.name || "Unknown"
    });
  };

  const updateCandidateStatus = async (newStatus) => {
    console.log("🔍 updateCandidateStatus called with status:", newStatus);
    console.log("🔍 Status reason:", statusReason);
    console.log("🔍 Selected candidate:", selectedStatusCandidate);

    if (!newStatus || !statusReason.trim() || !selectedStatusCandidate) {
      console.log("❌ Missing required fields");
      return;
    }

    try {
      setStatusLoading(true);

      const user = JSON.parse(localStorage.getItem("user")) || {};
      const changedBy = user.name || user.username || 'Unknown';

      // STEP 1: Update candidate status
      const statusRequest = {
        candidateId: selectedStatusCandidate.id,
        demandId: selectedDemandId,
        status: newStatus,
        reason: statusReason,
        changedBy: changedBy
      };

      console.log("📤 Sending status update:", statusRequest);

      const statusResponse = await axios.put(`https://myuandwe-bg.vercel.app/api/selected-candidates/status`, statusRequest);

      if (statusResponse.data.success) {
        console.log("✅ Status updated successfully");

        // STEP 2: Manage zone entry based on the new status
        const zoneRequest = {
          candidateId: selectedStatusCandidate.id,
          clientName: selectedDemandDetails?.clientName,
          demandId: selectedDemandId,
          status: newStatus,
          reason: statusReason,
          rejectedBy: changedBy
        };

        console.log("📤 Managing zone entry:", zoneRequest);

        await axios.post(`https://myuandwe-bg.vercel.app/api/zone/manage`, zoneRequest);

        // STEP 3: Refresh the candidates list
        const updatedCandidates = await fetchSelectedCandidates(selectedDemandId);
        setCurrentSelectedCandidates(updatedCandidates);
        setSelectedCandidates(prev => ({
          ...prev,
          [selectedDemandId]: updatedCandidates
        }));

        // Close modal and reset states
        setShowStatusEditModal(false);
        setSelectedStatusCandidate(null);
        setStatusReason('');
        setSelectedNewStatus('');

        // Show success message
        //alert(`Candidate status updated to "${newStatus}"!`);

      } else {
        console.error("❌ Status update failed");
        alert('Failed to update status');
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="min-h-screen bg-white/50 backdrop-blur-sm">
        <Header />

        <div className="p-6 max-w-[95%] mx-auto">
          {/* TITLE */}
          <div className="flex justify-between mb-6 bg-white shadow-md rounded-2xl p-4">
            <div>
              <h2 className="text-3xl font-bold">Demand Dashboard</h2>
<p className="text-gray-500">
  {userRole === "Client Interviewer" && userClientName
    ? `Showing active demands for client: ${userClientName}`
    : (userRole === "Interviewer" || userRole === "Recruiter") && userClientName
      ? `Showing demands for client: ${userClientName}`
      : "View all demand requirements"}
</p>
            </div>

            <div className="flex gap-3 items-center">
  {/* Show ADD button only for Admin */}
  {userRole === "Admin" && (
    <button
      onClick={handleAddButtonClick}
      className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
    >
      ADD
    </button>
  )}

  {/* Show Export button only for Admin */}
  {userRole === "Admin" && (
    <button
      onClick={handleExport}
      className="px-6 py-2 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
    >
      Export
    </button>
  )}
  
  <input
    type="text"
    placeholder="Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="px-4 py-2 border-2 border-blue-500 rounded-xl w-56 
focus:border-blue-600 focus:ring-2 focus:ring-blue-200 
outline-none"
  />

  {/* Hide dropdown for Client Interviewer */}
  {userRole !== "Client Interviewer" && (
    <select
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700
        border border-gray-300
        hover:bg-gray-100 cursor-pointer
        focus:ring-2 focus:ring-gray-300 outline-none"
    >
      <option value="active">Show: Active Only</option>
      <option value="fulfilled">Show: Fulfilled Only</option>
      <option value="closed">Show: Closed Only</option>
      <option value="cancelled">Show: Cancelled Only</option>
      <option value="all">Show: All Status</option>
      <option value="priority">Sort: Priority (High to Low)</option>
      <option value="date">Sort: Date (Newest First)</option>
    </select>
  )}
</div>
          </div>

          {/* TABLE */}
          <div className="bg-white rounded-2xl shadow-xl p-4 overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-100 uppercase text-xs">
                  <th className="px-4 py-3">S/N</th>
                  <th className="px-4 py-3">RR No</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Skills</th>
                  <th className="px-4 py-3">Ageing</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Recruiter</th>
                </tr>
              </thead>

              <tbody>
                {currentItems.map((d, index) => (
                  <tr key={d.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{indexOfFirstItem + index + 1}</td>
                    <td
                      className="px-4 py-3 font-semibold text-blue-600 cursor-pointer hover:underline"
                      onClick={() => setSelectedDemand(d)}
                    >
                      {d.rrNumber || `RR${String(d.id).padStart(3, "0")}`}
                    </td>
                    <td className="px-4 py-3">{d.clientName}</td>
                    <td className="px-4 py-3">
                      {d.location}, {d.country}
                    </td>
                    <td className="px-4 py-3">
                      {(d.primarySkill || []).join(", ")} / {(d.secondarySkill || []).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      {d.ageingWeeks ?? calculateAgeing(d.createdDate)} weeks
                    </td>
                    <td className="px-4 py-3">
                      {d.expFrom}-{d.expTo} yrs
                    </td>
                    <td className="px-4 py-3">{d.jobPriority}</td>
                    <td className="px-4 py-3">{d.recruiterPOC}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* No Data Found Message */}
            {sortedDemands.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No demands found
                </h3>
                <p className="text-gray-500">
                  {searchTerm
                    ? `No results found for "${searchTerm}". Try a different search term.`
                    : "No demand data available."}
                </p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {sortedDemands.length > 0 && (
            <div className="flex justify-between items-center mt-6 bg-white rounded-xl p-4 shadow-sm">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedDemands.length)} of {sortedDemands.length} entries
              </div>

              <div className="flex gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show only current page, first, last, and adjacent pages
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => paginate(pageNumber)}
                          className={`w-10 h-10 rounded-lg transition-colors ${currentPage === pageNumber
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    // Show ellipsis
                    if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                      return <span key={pageNumber} className="w-10 h-10 flex items-center justify-center">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg transition-colors ${currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                    }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ================= POPUP ================= */}
        {(formDemand || isAdding) && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            {/* Main popup container with fixed max height */}
            <div className="bg-white w-[92%] max-w-4xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh]">

              {/* Fixed Header - outside scroll area */}
              <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-bold">
                  {isAdding
                    ? "Add New Demand"
                    : `${formDemand?.rrNumber || `RR${String(formDemand?.id).padStart(3, "0")}`} – Demand Details`}
                </h3>

                <div className="flex gap-3">
                  {(isEditing || isAdding) ? (
                    <>
                      <button
                        onClick={handleSaveDemand}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                          ${isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white"}`}
                        title="Save"
                      >
                        {isSaving ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            {isAdding ? "Create" : "Save"}
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Cancel"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
{/* Show Edit button only for Admin */}
{userRole === "Admin" && (
  <button
    onClick={() => handleEditDemand(selectedDemand)}
    className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
    title="Edit"
  >
    <Pencil size={18} />
    Edit
  </button>
)}

                      {/* Show Delete button only for Admin */}
                      {userRole === "Admin" && (
                        <button
                          onClick={() => handleDeleteDemand(selectedDemand.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedDemand(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        title="Close"
                      >
                        <X size={18} />
                        Close
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="overflow-y-auto px-6 pb-6">
                {/* INFO */}
                <div className="grid grid-cols-2 gap-4 text-sm border rounded-2xl p-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} /> <b>Client:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="text"
                        value={isAdding ? newDemand?.clientName || "" : editedDemand?.clientName || ""}
                        onChange={(e) => handleInputChange("clientName", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter client name"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.clientName}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <GraduationCap size={16} /><b>Experience:</b>
                    {(isEditing || isAdding) ? (
                      <div className="flex gap-2 ml-2">
                        <input
                          type="number"
                          value={isAdding ? newDemand?.expFrom || "" : editedDemand?.expFrom || ""}
                          onChange={(e) => handleInputChange("expFrom", e.target.value)}
                          className="px-2 py-1 border rounded w-16"
                          placeholder="From"
                        />
                        <span>-</span>
                        <input
                          type="number"
                          value={isAdding ? newDemand?.expTo || "" : editedDemand?.expTo || ""}
                          onChange={(e) => handleInputChange("expTo", e.target.value)}
                          className="px-2 py-1 border rounded w-16"
                          placeholder="To"
                        />
                        <span>yrs</span>
                      </div>
                    ) : (
                      <span className="ml-2">{formDemand?.expFrom}-{formDemand?.expTo} yrs</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Flag size={16} /> <b>Country:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="text"
                        value={isAdding ? newDemand?.country || "" : editedDemand?.country || ""}
                        onChange={(e) => handleInputChange("country", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter country"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.country}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={16} /> <b>Location:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="text"
                        value={isAdding ? newDemand?.location || "" : editedDemand?.location || ""}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter location"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.location}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} /> <b>Creation date:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="date"
                        value={isAdding ? newDemand?.createdDate || "" : editedDemand?.createdDate || ""}
                        onChange={(e) => handleInputChange("createdDate", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.createdDate}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={16} /> <b>Ageing in weeks:</b>
                    <span className="ml-2">{formDemand ? (formDemand.ageingWeeks ?? calculateAgeing(formDemand.createdDate)) : "0"}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Flame size={16} /> <b>Priority:</b>
                    {(isEditing || isAdding) ? (
                      <select
                        value={isAdding ? newDemand?.jobPriority || "Medium" : editedDemand?.jobPriority || ""}
                        onChange={(e) => handleInputChange("jobPriority", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    ) : (
                      <span className="ml-2">{formDemand?.jobPriority}</span>
                    )}
                  </div>

                  {/* Status - Simple row */}
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} /> <b>Status:</b>
                    {(isEditing || isAdding) ? (
                      <select
                        value={isAdding ? newDemand?.status || "Active" : editedDemand?.status || "Active"}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          handleInputChange("status", newStatus);
                        }}
                        className="ml-2 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-44"
                      >
                        <option value="Active">Active</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className="ml-2 font-bold px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg shadow-sm">
                        {formDemand?.status || "Active"}
                      </span>
                    )}
                  </div>

                  {/* Interviewer 1 */}
                  <div className="flex items-center gap-2">
                    <User size={16} /> <b>UANDWE Interviewer:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="text"
                        value={isAdding ? newDemand?.interviewer1 || "" : editedDemand?.interviewer1 || ""}
                        onChange={(e) => handleInputChange("interviewer1", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter interviewer name"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.interviewer1}</span>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <b>Reason:</b>
                    {(isEditing) ? (
                      <input
                        type="text"
                        value={statusChangeDesc}
                        onChange={(e) => setStatusChangeDesc(e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter reason"
                      />
                    ) : (
                      <span className="ml-2">
                        {(() => {
                          const history = formDemand?.statusHistory;
                          if (typeof history === 'string' && history.trim() !== "") {
                            // Extract just the reason part if the format includes metadata
                            const reasonPart = history.split(' (by')[0];
                            return reasonPart;
                          }
                          return "";
                        })()}
                      </span>
                    )}
                  </div>

                  {/* Interviewer 2 */}
                  <div className="flex items-center gap-2">
                    <User size={16} /> <b> Client Interviewer:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="text"
                        value={isAdding ? newDemand?.interviewer2 || "" : editedDemand?.interviewer2 || ""}
                        onChange={(e) => handleInputChange("interviewer2", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter interviewer name"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.interviewer2}</span>
                    )}
                  </div>

                  {/* Recruiter */}
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} />
                    <b>Recruiter:</b>
                    {(isEditing || isAdding) ? (
                      <input
                        type="text"
                        value={isAdding ? newDemand?.recruiterPOC || "" : editedDemand?.recruiterPOC || ""}
                        onChange={(e) => handleInputChange("recruiterPOC", e.target.value)}
                        className="ml-2 px-2 py-1 border rounded w-full"
                        placeholder="Enter recruiter name"
                      />
                    ) : (
                      <span className="ml-2">{formDemand?.recruiterPOC}</span>
                    )}
                  </div>
                </div>

                {/* PRIMARY SKILLS */}
                <div className="mt-5">
                  <div className="flex justify-between items-center">
                    <b>Primary Skills</b>
                    {(isEditing || isAdding) && (
                      <button
                        onClick={() => handleAddSkill("primarySkill")}
                        className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        + Add Skill
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(isEditing || isAdding) ? (
                      (isAdding ? newDemand?.primarySkill || [""] : editedDemand?.primarySkill || []).map((skill, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => handleSkillChange("primarySkill", index, e.target.value)}
                            className="px-3 py-1 border rounded-full text-xs w-32"
                            placeholder="Enter skill"
                          />
                          <button
                            onClick={() => handleRemoveSkill("primarySkill", index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      (formDemand?.primarySkill || []).map((s) => (
                        <span key={s} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* SECONDARY SKILLS */}
                <div className="mt-3">
                  <div className="flex justify-between items-center">
                    <b>Secondary Skills</b>
                    {(isEditing || isAdding) && (
                      <button
                        onClick={() => handleAddSkill("secondarySkill")}
                        className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        + Add Skill
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {(isEditing || isAdding) ? (
                      (isAdding ? newDemand?.secondarySkill || [""] : editedDemand?.secondarySkill || []).map((skill, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => handleSkillChange("secondarySkill", index, e.target.value)}
                            className="px-3 py-1 border rounded-full text-xs w-32"
                            placeholder="Enter skill"
                          />
                          <button
                            onClick={() => handleRemoveSkill("secondarySkill", index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      (formDemand?.secondarySkill || []).map((s) => (
                        <span key={s} className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="mt-5">
                  <b>Job Description</b>
                  <div className="mt-2">
                    {(isEditing || isAdding) ? (
                      <textarea
                        value={isAdding ? newDemand?.jobDescription || "" : editedDemand?.jobDescription || ""}
                        onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                        className="w-full p-4 border rounded-xl bg-gray-50 text-sm h-64 resize-y"
                        placeholder="Enter job description"
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                    ) : (
                      <div
                        className="p-4 border rounded-xl bg-gray-50 text-sm overflow-auto"
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {formDemand?.jobDescription}
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                {/* ACTION BUTTONS */}
                <div className="mt-6 flex justify-center gap-4 pb-2">
                  {!isAdding && formDemand?.id && (
                    <>
                      {/* View Candidates button - Admin and Recruiter */}
                      {(userRole === "Admin" || userRole === "Recruiter") && (
                        <button
                          onClick={() => handleViewCandidates(formDemand)}
                          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                        >
                          <Search size={18} /> View Candidates
                        </button>
                      )}

                      {/* View Selected button - Admin, Interviewer, and Recruiter */}
                      <button
                        onClick={() => handleViewSelectedCandidates(formDemand)}
                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-lg"
                      >
                        <Users size={18} /> View Selected ({selectedCandidates[formDemand.id]?.length || 0})
                      </button>
                    </>
                  )}
                </div>

              </div> {/* Closes Scrollable Content Area */}
            </div> {/* Closes Main popup container */}
          </div> /* Closes POPUP wrapper div */
        )}

        {/* Selected Candidates Modal */}
        {showSelectedModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">Selected Candidates</h3>
                  <p className="text-gray-500 text-sm">
                    Demand: {selectedDemandDetails?.rrNumber || `RR${String(selectedDemandId).padStart(3, "0")}`} •
                    {selectedDemandDetails?.clientName && ` ${selectedDemandDetails.clientName} • `}
                    {currentSelectedCandidates.length} candidates selected
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSelectedModal(false);
                    setCurrentSelectedCandidates([]);
                    setSelectedDemandId(null);
                    setSelectedDemandDetails(null);
                    setShowHistoryModal(false);
                    setSelectedHistoryCandidate(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {loadingSelected ? (
                  <div className="flex justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : currentSelectedCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      No candidates selected yet
                    </h3>
                    <p className="text-gray-500">
                      Click "View Candidates" to find and select candidates for this demand
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentSelectedCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="border rounded-xl p-4 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-lg">{candidate.name}</h4>
                            <p className="text-xs text-gray-500">
                              Added by: <span className="font-medium text-gray-700">{candidate.selectedBy || 'Unknown'}</span> •
                              {new Date(candidate.selectedAt).toLocaleDateString()}
                            </p>
                          </div>
<div className="flex items-center gap-2">
  <span className={`px-2 py-1 text-xs rounded-full ${candidate.status === 'Selected' ? 'bg-green-100 text-green-700' :
    candidate.status === 'Rejected' ? 'bg-red-100 text-red-700' :
      'bg-yellow-100 text-yellow-700'
    }`}>
    {candidate.status}
  </span>

  {/* Edit Status Button - Admin, Recruiter, Interviewer, and Client Interviewer */}
  {(userRole === "Admin" || userRole === "Recruiter" || userRole === "Interviewer" || userRole === "Client Interviewer") && (
    <button
      onClick={() => openStatusEditModal(candidate)}
      className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
      title="Edit Status"
    >
      <Pencil size={16} />
    </button>
  )}

  {/* History Button - Admin and Recruiter only (not Interviewer or Client Interviewer) */}
  {(userRole === "Admin" || userRole === "Recruiter") && (
    <button
      onClick={() => viewCandidateHistory(candidate)}
      className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition"
      title="View History"
    >
      <Clock size={16} />
    </button>
  )}
</div>
                        </div>

                        {/* Resume Link */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <FileText size={14} className="text-gray-500" />
                            {candidate.resumePath || candidate.googleDriveViewLink ? (
                              <a
                                href={candidate.googleDriveViewLink || `https://myuandwe-bg.vercel.app${candidate.resumePath}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Resume
                              </a>
                            ) : (
                              <span className="text-gray-400">No Resume</span>
                            )}
                          </div>
                        </div>

                        {/* Show latest reason/description if available - Admin and Recruiter */}
{/* Show latest reason/description if available - Admin and Recruiter only (not Interviewer) */}
{(userRole === "Admin" || userRole === "Recruiter") && candidate.history && candidate.history.length > 0 && (
  <div className="mb-2 text-sm bg-gray-50 p-2 rounded">
    <span className="text-xs font-semibold text-gray-500">Latest Update:</span>
    <p className="text-gray-700 mt-1">
      {candidate.history[candidate.history.length - 1].reason ||
        `Status changed to ${candidate.status}`}
    </p>
    <p className="text-xs text-gray-400 mt-1">
      by {candidate.history[candidate.history.length - 1].changedBy} •
      {new Date(candidate.history[candidate.history.length - 1].changedAt).toLocaleString()}
    </p>
  </div>
)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Status Edit Modal */}
        {showStatusEditModal && selectedStatusCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Update Status</h3>
                  <button
                    onClick={() => {
                      setShowStatusEditModal(false);
                      setSelectedStatusCandidate(null);
                      setStatusReason('');
                      setSelectedNewStatus('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <p className="text-gray-600 mb-4">
                  Updating status for <span className="font-semibold">{selectedStatusCandidate.name}</span>
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Current Status: <span className="font-medium">{selectedStatusCandidate.status}</span>
                </p>

                <div className="space-y-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Select New Status</label>
                    <select
                      value={selectedNewStatus}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        console.log("📝 Dropdown changed to:", newValue);
                        setSelectedNewStatus(newValue);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>-- Select Status --</option>
                      <option value="Pending Screening">Pending Screening</option>
                      <option value="Pending Interview">Pending Interview</option>
                      <option value="Pending Client Screening">Pending Client Screening</option>
                      <option value="Pending Client Interview">Pending Client Interview</option>
                      <option value="Pending Offer">Pending Offer</option>
                      <option value="Pending Joinee">Pending Joinee</option>
                      <option value="Offer Decline">Offer Decline</option>
                      <option value="Interview Reject">Interview Reject</option>
                      <option value="Client Interview Reject">Client Interview Reject</option>
                      <option value="Screening Reject">Screening Reject</option>
                      <option value="Client Screening Reject">Client Screening Reject</option>
                    </select>
                  </div>

                  {/* Reason/Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reason / Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Please provide a reason for this status change..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowStatusEditModal(false);
                      setSelectedStatusCandidate(null);
                      setStatusReason('');
                      setSelectedNewStatus('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      console.log("🔍 Update button clicked - selectedNewStatus:", selectedNewStatus);
                      console.log("🔍 Status reason:", statusReason);

                      if (selectedNewStatus && statusReason.trim()) {
                        // Make sure we're passing the exact status string
                        updateCandidateStatus(selectedNewStatus);
                      } else {
                        alert('Please select a status and provide a reason');
                      }
                    }}
                    disabled={!selectedNewStatus || !statusReason.trim()}
                    className={`px-6 py-2 rounded-lg transition flex items-center gap-2 ${!selectedNewStatus || !statusReason.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                  >
                    {statusLoading ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Update Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && selectedHistoryCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Candidate History</h3>
                  <p className="text-gray-500 text-sm">
                    {selectedHistoryCandidate.name} • Current Status:
                    <span className={`ml-1 font-medium ${selectedHistoryCandidate.status === 'Selected' ? 'text-green-600' :
                      selectedHistoryCandidate.status === 'Rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                      {selectedHistoryCandidate.status}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedHistoryCandidate(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(70vh-120px)]">
                {/* Selection Event */}
                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UserCheck size={14} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Candidate Selected</span>
                        <span className="text-xs text-gray-400">
                          {new Date(selectedHistoryCandidate.selectedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Added to <span className="font-medium text-blue-600">{selectedHistoryCandidate.demandRrNumber}</span> by{' '}
                        <span className="font-medium">{selectedHistoryCandidate.selectedBy}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Initial status: In Progress</p>
                    </div>
                  </div>
                </div>

                {/* Status Change History */}
                {selectedHistoryCandidate.history && selectedHistoryCandidate.history.length > 0 ? (
                  <div className="space-y-4">
                    {selectedHistoryCandidate.history
                      .filter(entry => entry.fromStatus && entry.toStatus)
                      .map((entry, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${entry.toStatus === 'Selected' ? 'bg-green-100' :
                            entry.toStatus === 'Rejected' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                            {entry.toStatus === 'Selected' ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : entry.toStatus === 'Rejected' ? (
                              <XCircle size={14} className="text-red-600" />
                            ) : (
                              <Clock size={14} className="text-yellow-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            {entry.fromStatus && entry.toStatus && (
                              <>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold">
                                    {entry.fromStatus} → {entry.toStatus}
                                  </span>

                                  <span className="text-xs text-gray-400">
                                    {new Date(entry.changedAt).toLocaleString()}
                                  </span>
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                  Updated by: <span className="font-medium">{entry.changedBy}</span>
                                </p>

                                {/* ✅ ADD THIS PART */}
                                {entry.reason && (
                                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                                    {entry.reason}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No additional history available</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div> {/* Closes the bg-white/50 backdrop div */}
    </div> /* Closes the main min-h-screen div */
  );
};

export default Demand;
