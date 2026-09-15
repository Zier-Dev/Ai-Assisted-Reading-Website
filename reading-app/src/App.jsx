import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import ManagerDashboard from './pages/Manager';
import Reading from './pages/Reading';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);

  // Check if a user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);

        setUser(userData);

        // Check the user's role
        if (userData.role === 'Manager') {
          setCurrentPage('manager');
        } else if (userData.role === 'Student') {
          setCurrentPage('reading');
        }

      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Login function
  const handleLogin = (userData) => {
    setUser(userData);

    // Send the user to the correct page
    if (userData.role === 'Manager') {
      setCurrentPage('manager');
    } else if (userData.role === 'Student') {
      setCurrentPage('reading');
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    setUser(null);
    setCurrentPage('login');
  };

  // Login page
  if (currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  // Manager page
  if (currentPage === 'manager') {
    return (
      <ManagerDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Student Reading page
  if (currentPage === 'reading') {
    return <Reading />;
  }

  // Default
  return <Login onLogin={handleLogin} />;
}

export default App;