import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/Admin';
import Reading from './pages/Reading';
import Register from './pages/Register';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);

        setUser(userData);

        // Check the user's role
        if (userData.role === 'Admin') {
          setCurrentPage('admin');
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
    if (userData.role === 'Admin') {
      setCurrentPage('admin');
    } else if (userData.role === 'Student') {
      setCurrentPage('reading');
    }
  };

  // Logout function
  const handleLogout = () => {
    const confirmLogout = window.confirm(
    'Are you sure you want to logout?'
  );

    if (confirmLogout) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
    }
   
  };

 // 1. Check Register First
  if (currentPage === 'register') {
    return <Register onGoToLogin={() => setCurrentPage('login')} />;
  }

  // 2. Check Admin
  if (currentPage === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  // 3. Check Reading
  if (currentPage === 'reading') {
    return <Reading user={user} onLogout={handleLogout} />;
  }

  // 4. Default: Render Login AND pass onGoToRegister
  return (
    <Login 
      onLogin={handleLogin} 
      onGoToRegister={() => setCurrentPage('register')} 
    />
  );
}

export default App;