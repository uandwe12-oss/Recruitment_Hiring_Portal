import React, { useState, useEffect } from "react";
import Header from "../components/Header"
import bgImage from "../assets/Images/back.png";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  UserCheck,
  Save,
  Trash2
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
  
  const formDemand = isAdding
    ? newDemand
    : isEditing
    ? editedDemand
    : selectedDemand;

  const navigate = useNavigate();

  // Get user role from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  const fetchDemands = async () => {
    try {
      const response = await fetch("https://recruitment-hiring-portal.vercel.app/api/demand");
      if (!response.ok) throw new Error("Failed to fetch demands");
      const data = await response.json();
      setDemands(data);
    } catch (err) {
      console.error("❌ Error fetching demands:", err);
    }
  };

  const handleExport = () => {
    if (!demands.length) {
      alert("No data to export");
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
        "Job Description": d.jobDescription || ""
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
      { wch: 50 }    // Job Description
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

      const response = await fetch("https://recruitment-hiring-portal.vercel.app/api/demand", {
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
      
      // Optionally show success message
      alert("Demand created successfully!");

    } catch (err) {
      console.error("❌ Create error details:", err);
      alert(`Failed to create demand: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDemand = async (demandId) => {
    if (!window.confirm("Are you sure you want to delete this demand?")) {
      return;
    }

    try {
      const response = await fetch(`https://recruitment-hiring-portal.vercel.app/api/demand/${demandId}`, {
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

      alert("Demand deleted successfully!");
    } catch (err) {
      console.error("❌ Error deleting demand:", err);
      alert(`Failed to delete demand: ${err.message}`);
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
const statusFilteredDemands = demands.filter((d) => {
  if (sortBy === "active") {
    return d.status === "Active"; // Show only Active
  }
  if (sortBy === "inactive") {
    return d.status === "Inactive"; // Show only Inactive
  }
  return true; // For priority sort, show all
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
    setIsEditing(true);
    setEditedDemand({ ...demand });
  };

  const handleSaveDemand = async () => {
    // If we're in "add" mode, call create function
    if (isAdding && newDemand) {
      await handleCreateDemand();
      return;
    }

    // Otherwise, it's an edit
    if (!editedDemand?.id) return;

    try {
      setIsSaving(true);

      const response = await fetch(
        `https://recruitment-hiring-portal.vercel.app/api/demand/${editedDemand.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editedDemand),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update demand");
      }

      await fetchDemands();

      setSelectedDemand(editedDemand);
      setIsEditing(false);
      setEditedDemand(null);

      console.log("✅ Demand updated successfully");
    } catch (err) {
      console.error("❌ Error updating demand:", err);
      alert(`Failed to update demand: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setIsAdding(false);
    setEditedDemand(null);
    setNewDemand(null);
    if (!selectedDemand) {
      setSelectedDemand(null);
    }
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
      alert("Cannot view candidates for a demand that hasn't been saved yet.");
      return;
    }
    navigate(`/recruiter/candidates/${demand.id}`);
  };

  const handleAddButtonClick = () => {
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
    });
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
              <p className="text-gray-500">View all demand requirements</p>
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

  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value)}
    className="px-3 py-2 rounded-lg bg-gray-50 text-gray-700
             border border-gray-300
             hover:bg-gray-100 cursor-pointer
             focus:ring-2 focus:ring-gray-300 outline-none"
  >
    <option value="active">Show: Active Only</option>
    <option value="inactive">Show: Inactive Only</option>
    <option value="priority">Sort: Priority (High to Low)</option>
    <option value="date">Sort: Date</option>
  </select>
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === 1
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
                          className={`w-10 h-10 rounded-lg transition-colors ${
                            currentPage === pageNumber
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === totalPages
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

                  <div className="flex items-center gap-2">
  <CheckCircle size={16} /> <b>Status:</b>
  {(isEditing || isAdding) ? (
    <select
      value={isAdding ? newDemand?.status || "Active" : editedDemand?.status || ""}
      onChange={(e) => handleInputChange("status", e.target.value)}
      className="ml-2 px-2 py-1 border rounded"
    >
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  ) : (
    <span className="ml-2">{formDemand?.status}</span>
  )}
</div>
                  <div className="flex items-center gap-2">
                    <User size={16} /> <b>Interviewer 1:</b>
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

                  <div className="flex items-center gap-2">
                    <User size={16} /> <b>Interviewer 2:</b>
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
                <div className="mt-6 flex justify-center gap-4 pb-2">
                  {!isAdding && formDemand?.id && (
                    <button
                      onClick={() => handleViewCandidates(formDemand)}
                      className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                    >
                      <Search size={18} /> View Candidates
                    </button>
                  )}

                  {(isEditing || isAdding) && (
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-8 py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 shadow-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div> {/* Closes Scrollable Content Area */}
            </div> {/* Closes Main popup container */}
          </div> /* Closes POPUP wrapper div */
        )}
      </div> {/* Closes the bg-white/50 backdrop div */}
    </div> /* Closes the main min-h-screen div */
  );
};

export default Demand;
