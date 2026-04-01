import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import bgImage from "../assets/Images/back.png";
import { UserPlus, Save, X, Trash2, Edit2, Search, Building2 } from "lucide-react";

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "Recruiter",
    assignedClient: ""
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [apiStatus, setApiStatus] = useState({ checking: true, online: false });
  
  // State for clients list from demands
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [filteredClients, setFilteredClients] = useState([]);

  // Check if backend is reachable
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch("https://myuandwe-bg.vercel.app/api/users", {
        method: "HEAD",
      });
      setApiStatus({ checking: false, online: response.ok });
    } catch (err) {
      setApiStatus({ checking: false, online: false });
    }
  };

  // Fetch all users on component mount
  useEffect(() => {
    if (apiStatus.online) {
      fetchUsers();
      fetchClients(); // Fetch clients when backend is online
    }
  }, [apiStatus.online]);

  // Filter clients based on search term
  useEffect(() => {
    if (clientSearchTerm.trim()) {
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [clientSearchTerm, clients]);

  const fetchUsers = async () => {
    try {
      console.log("📡 Fetching users from API...");
      const response = await fetch("https://myuandwe-bg.vercel.app/api/users");
      console.log("📡 Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("❌ Received non-JSON response:", text.substring(0, 200));
        throw new Error("Server returned HTML instead of JSON. Backend might not be running.");
      }
      
      const data = await response.json();
      console.log("📡 Response data:", data);
      
      if (data.success) {
        setUsers(data.users);
        setMessage({ type: "success", text: `Loaded ${data.users.length} users` });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({ type: "error", text: data.message || "Failed to load users" });
      }
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      setMessage({ type: "error", text: err.message });
    }
  };

  // Fetch unique client names from demands
  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      console.log("📡 Fetching client names from demands...");
      const response = await fetch("https://myuandwe-bg.vercel.app/api/demand/clients/list");
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📡 Clients response:", data);
      
      if (data.success) {
        setClients(data.clients);
        setFilteredClients(data.clients);
      } else {
        console.error("Failed to fetch clients:", data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching clients:", err);
    } finally {
      setClientsLoading(false);
    }
  };

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({
    ...formData,
    [name]: value
  });
  
  // Reset assigned client when role changes from Interviewer or Client Interviewer to something else
  if (name === "role" && value !== "Interviewer" && value !== "Client Interviewer") {
    setFormData(prev => ({ ...prev, assignedClient: "" }));
  }
};

  const handleClientSelect = (clientName) => {
    setFormData(prev => ({ ...prev, assignedClient: clientName }));
    setClientSearchTerm(clientName);
    setShowClientDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Prepare data for API
      const submitData = {
        username: formData.username,
        password: formData.password,
        role: formData.role
      };
      
// If role is Interviewer or Client Interviewer, include assignedClient
if ((formData.role === "Interviewer" || formData.role === "Client Interviewer") && formData.assignedClient) {
  submitData.assignedClient = formData.assignedClient;
}

      const response = await fetch("https://myuandwe-bg.vercel.app/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error("Server returned HTML. Backend might not be running.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      setMessage({ type: "success", text: "User created successfully!" });
      setFormData({
        username: "",
        password: "",
        role: "Recruiter",
        assignedClient: ""
      });
      setClientSearchTerm("");
      
      // Refresh user list
      fetchUsers();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
      assignedClient: user.assignedClient || ""
    });
    if (user.assignedClient) {
      setClientSearchTerm(user.assignedClient);
    }
  };
const handleUpdate = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage({ type: "", text: "" });

  try {
    // Prepare update data
    const updateData = { role: formData.role };
    
// If role is Interviewer or Client Interviewer and assigned client is provided, include it
if ((formData.role === "Interviewer" || formData.role === "Client Interviewer") && formData.assignedClient) {
  updateData.assignedClient = formData.assignedClient;
  console.log(`Updating user ${editingUser.username} - Role: ${formData.role}, Client: ${formData.assignedClient}`);
} else {
  console.log(`Updating user ${editingUser.username} - Role: ${formData.role}`);
}
    
    const response = await fetch(`https://myuandwe-bg.vercel.app/api/users/${encodeURIComponent(editingUser.username)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error("Server returned HTML. Backend might not be running.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update user");
    }

    setMessage({ type: "success", text: "User updated successfully!" });
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      role: "Recruiter",
      assignedClient: ""
    });
    setClientSearchTerm("");
    
    // Refresh user list
    await fetchUsers();
    
  } catch (err) {
    console.error("Error updating user:", err);
    setMessage({ type: "error", text: err.message });
  } finally {
    setLoading(false);
  }
};
const handleDelete = async (username) => {
  if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
    return;
  }

  try {
    const response = await fetch(`https://myuandwe-bg.vercel.app/api/users/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error("Server returned HTML. Backend might not be running.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete user");
    }

    setMessage({ type: "success", text: "User deleted successfully!" });
    
    // Refresh user list
    await fetchUsers();
  } catch (err) {
    setMessage({ type: "error", text: err.message });
  }
};

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      username: "",
      password: "",
      role: "Recruiter",
      assignedClient: ""
    });
    setClientSearchTerm("");
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.assignedClient && user.assignedClient.toLowerCase().includes(searchTerm.toLowerCase()))
  );

const getRoleBadgeClass = (role) => {
  if (role === "Admin") {
    return "bg-purple-100 text-purple-700";
  } else if (role === "Recruiter") {
    return "bg-blue-100 text-blue-700";
  } else if (role === "Interviewer") {
    return "bg-green-100 text-green-700";
  } else if (role === "Client Interviewer") {
    return "bg-orange-100 text-orange-700";
  } else if (role === "Employee") {
    return "bg-gray-100 text-gray-700";
  } else {
    return "bg-gray-100 text-gray-700";
  }
};

  // Show backend status
  if (apiStatus.checking) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="min-h-screen bg-white/50 backdrop-blur-sm">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Checking backend connection...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!apiStatus.online) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="min-h-screen bg-white/50 backdrop-blur-sm">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
              <div className="text-red-500 text-6xl mb-4">🔌</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Backend Not Reachable</h2>
              <p className="text-gray-600 mb-4">Cannot connect to https://myuandwe-bg.vercel.app/</p>
              <p className="text-sm text-gray-500">Please make sure your backend server is running</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry Connection
              </button>
            </div>
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

        <div className="p-6 max-w-6xl mx-auto">
          {/* Title */}
          <div className="bg-white shadow-md rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className="text-gray-500">Create, edit and manage system users</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Create/Edit Form */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? `Edit User: ${editingUser.username}` : "Create New User"}
              </h3>

              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-xl ${
                    message.type === "success"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={editingUser ? handleUpdate : handleSubmit} className="space-y-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={editingUser}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none ${
                      editingUser ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    placeholder="Enter username"
                  />
                </div>

                {/* Password - only show for new user */}
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!editingUser}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                      placeholder="Enter password"
                    />
                  </div>
                )}

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                 <select
  name="role"
  value={formData.role}
  onChange={handleChange}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
>
  <option value="Recruiter">Recruiter (Can view and manage candidates)</option>
  <option value="Interviewer">UANDWE Interviewer (Conduct interviews for assigned clients)</option>
  <option value="Client Interviewer">Client Interviewer (Client-side interviewer)</option>
  <option value="Admin">Admin (Full access)</option>
  <option value="Employee">Employee (View-only access)</option>
</select>
<p className="text-xs text-gray-500 mt-1">
  Admin can edit/delete demands and manage users. Recruiter can view and manage candidates. 
  UANDWE Interviewer can conduct interviews for assigned clients. 
  Client Interviewer can conduct client-side interviews for assigned clients.
  Employee has view-only access to demands and candidates.
</p> 
                </div>

                {/* Assigned Client - Only show when role is Interviewer */}
{/* Assigned Client - Only show when role is Interviewer or Client Interviewer */}
{(formData.role === "Interviewer" || formData.role === "Client Interviewer") && (
  <div className="relative">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Assigned Client <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={clientSearchTerm}
        onChange={(e) => {
          setClientSearchTerm(e.target.value);
          setShowClientDropdown(true);
          if (e.target.value === "") {
            setFormData(prev => ({ ...prev, assignedClient: "" }));
          }
        }}
        onFocus={() => setShowClientDropdown(true)}
        placeholder="Search or select client..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
      />
    </div>
    
    {/* Client Dropdown */}
    {showClientDropdown && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
        {clientsLoading ? (
          <div className="px-4 py-2 text-center text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
            Loading clients...
          </div>
        ) : filteredClients.length > 0 ? (
          filteredClients.map((client, index) => (
            <div
              key={index}
              onClick={() => handleClientSelect(client.name)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {client.name}
            </div>
          ))
        ) : (
          <div className="px-4 py-2 text-center text-gray-500">
            No clients found. Please add clients in Demand section first.
          </div>
        )}
      </div>
    )}
    
    {formData.assignedClient && (
      <p className="text-xs text-green-600 mt-1">
        Selected client: {formData.assignedClient}
      </p>
    )}
  </div>
)}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || ((formData.role === "Interviewer" || formData.role === "Client Interviewer") && !formData.assignedClient)}
                    className={`flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                      (loading || (formData.role === "Interviewer" && !formData.assignedClient)) ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? (
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
                        {editingUser ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        {editingUser ? "Update User" : "Create User"}
                      </>
                    )}
                  </button>
                  
                  {editingUser && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right Column - User List */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Existing Users</h3>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="overflow-y-auto max-h-96">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.username} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.assignedClient || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.username)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateUser;
