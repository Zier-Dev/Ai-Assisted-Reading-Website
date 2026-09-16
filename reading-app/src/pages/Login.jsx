import { useState } from "react";
import "../style/Login.css";


function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !password || !role) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user: name,       
          password: password,
          role: role
        })
      });

      const data = await response.json();

   if (response.ok) {
        // Save user data
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.role === 'Admin') {
          window.location.href = '/Admin';
        } else if (data.user.role === 'Teacher') {
          window.location.href = '/teacher-dashboard';
        } else if (data.user.role === 'Student') {
          window.location.href = '/Reading';
        } 
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      
     <div className="school-header">
        <h1 className="school-title">
          Medroso-Mendoza National High School 
          <span className="subtitle">Reading System</span>
        </h1>
      </div>
      
      <div className="login-box">
        <h1 className="login-word">Login</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>

          <label className="word">Name</label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
          />

          <label className="word">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />

          <label className="word">Roles</label>
          <select 
            className="role" 
            value={role} 
            onChange={(event) => setRole(event.target.value)}
            disabled={loading}
          >
            <option value="">Select Role</option>
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
          </select>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;