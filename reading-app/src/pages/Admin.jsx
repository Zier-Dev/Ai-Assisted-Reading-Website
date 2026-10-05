import React, { useState, useEffect } from "react";
import "../style/Admin.css";

function ModalView({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

const AdminDashboard = ({ onLogout }) => {
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
   const [role, setRole] = useState("");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [error, setError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:5000/api/users");

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  
  const handleViewUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setIsOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      setIsOpen(false);
      setSelectedUser(null);

      await fetchUsers();

      alert("User deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message || "Cannot connect to server");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");

    // Check empty fields
    if (!name.trim() || !fullName.trim() || !password.trim() || !role.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: name.trim(),
          full_name: fullName.trim(),
          password: password,
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }
      alert("User registered successfully!");
      setName("");
      setFullName("");
      setPassword("");
      setError("");

      setIsAddOpen(false);

      await fetchUsers();
    } catch (error) {
      console.error("Register error:", error);
      setError(error.message || "Cannot connect to server");
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleCloseAddUser = () => {
    if (registerLoading) return;
    setIsAddOpen(false);
    setName("");
    setFullName("");
    setPassword("");
    setRole("");
    setError("");
  };
  return (
    <div className="admin-dashboard">
      {/* ================= HEADER ================= */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>

          <p>Welcome back, {user?.name || user?.full_name || "Admin"}!</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>
      {/* ================= STATISTICS ================= */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Admins</h3>
          <p className="stat-number">
            {users.filter((user) => user.role === "Admin").length}
          </p>
        </div>

        <div className="stat-card">
          <h3>Teachers</h3>

          <p className="stat-number">
            {users.filter((user) => user.role === "Teacher").length}
          </p>
        </div>

        <div className="stat-card">
          <h3>Students</h3>

          <p className="stat-number">
            {users.filter((user) => user.role === "Student").length}
          </p>
        </div>
      </div>

      {/* ================= USERS ================= */}
      <div className="users-section">
        <div className="section-header">
          <h2>All Users</h2>

          <div className="button-group">
            <button
              className="adduser-btn"
              onClick={() => {
                setError("");
                setIsAddOpen(true);
              }}
            > Add User
            </button>
            <button
              onClick={fetchUsers}
              className="refresh-btn"
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
        {/* ================= USER TABLE ================= */}
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : error && users.length === 0 ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No users found in the database.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>
                      <td>{user.user}</td>
                      <td>{user.full_name}</td>
                      <td>{user.role}</td>
                      <td>
                        <button
                          className="view-btn"
                          onClick={() => handleViewUser(user)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= VIEW USER MODAL ================= */}

      <ModalView isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {selectedUser && (
          <div className="modal-view">
            <h2>User Details</h2>

            <table className="modal-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>{selectedUser.user_id || selectedUser.id}</td>
                  <td>{selectedUser.user || selectedUser.username}</td>
                  <td>{selectedUser.full_name || selectedUser.name}</td>
                  <td>{selectedUser.role}</td>
                </tr>
              </tbody>
            </table>

            <button
              className="delete-btn"
              onClick={() =>
                handleDeleteUser(selectedUser.user_id || selectedUser.id)
              }
            >
              Delete User
            </button>

            <button className="close-btn" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        )}
      </ModalView>

      {/* ================= ADD USER MODAL ================= */}

      <ModalView isOpen={isAddOpen} onClose={handleCloseAddUser}>
        <div className="register-box">
          <h2>Add User</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleRegister}>
            <label>
              Username:
              <input
                type="text"
                placeholder="Username"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={registerLoading}
              />
            </label>

            <label>
              Full Name:
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={registerLoading}
              />
            </label>

            <label>
              Password:
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={registerLoading}
              />
            </label>

            <label className="word">Roles</label>
          <select 
            className="role" 
            value={role} 
            onChange={(event) => setRole(event.target.value)}
            disabled={loading}
          >
            <option value="">Select Role</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </select> 

            <button
              className="submit_btn"
              type="submit"
              disabled={registerLoading}
            >
              {registerLoading ? "Registering..." : "Submit"}
            </button>
          </form>
        </div>
      </ModalView>
    </div>
  );
};

export default AdminDashboard;