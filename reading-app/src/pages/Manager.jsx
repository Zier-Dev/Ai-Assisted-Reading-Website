import React, { useState, useEffect } from 'react';
import "../style/Manager.css";

const ManagerDashboard = () => {
  // Get user from localStorage (no useAuth)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all users from database
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Get role badge color
  const getRoleColor = (role) => {
    switch(role) {
      case 'Admin': return 'badge-admin';
      case 'Manager': return 'badge-manager';
      case 'Teacher': return 'badge-teacher';
      case 'Student': return 'badge-student';
      default: return 'badge-default';
    }
  };

  // Get role emoji
  const getRoleEmoji = (role) => {
    switch(role) {
      case 'Manager': return;
      case 'Teacher': return;
      case 'Student': return;
      default: return '👤';
    }
  };

  return (
    <div className="manager-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Manager Dashboard</h1>
          <p>Welcome back, {user?.name || user?.full_name || 'Manager'}!</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Managers</h3>
          <p className="stat-number">
            {users.filter(u => u.role === 'Manager').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Teachers</h3>
          <p className="stat-number">
            {users.filter(u => u.role === 'Teacher').length}
          </p>
        </div>
        <div className="stat-card">
          <h3>Students</h3>
          <p className="stat-number">
            {users.filter(u => u.role === 'Student').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-section">
        <div className="section-header">
          <h2>All Users</h2>
          <button onClick={fetchUsers} className="refresh-btn">
           Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : error ? (
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
                    <tr key={user.user_id || user.id}>
                      <td>{user.user_id || user.id}</td>
                      <td>{user.user || user.email}</td>
                      <td>{user.full_name || user.name}</td>
                      <td>
                        <span className={`role-badge ${getRoleColor(user.role)}`}>
                          {getRoleEmoji(user.role)} {user.role}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="view-btn"
                          onClick={() => alert(`User: ${user.full_name || user.name}\nRole: ${user.role}`)}
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
    </div>
  );
};

export default ManagerDashboard;