import { useState } from "react";
import "../style/Login.css";

function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    if (name === "student" && password === "1234") {
      alert("Login successful!");
    } else {
      alert("Incorrect name or password.");
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

        <form onSubmit={handleLogin}>

          <label className="word">Name</label>
          <input
            type="text"
            placeholder="Enter name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label className="word">Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

        <label className="word">Roles</label>
        <select className="role">
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
        <option value="manager">Manager</option>
        </select>

          <button type="submit" className="login-button">
            Login
          </button>

        </form>

      </div>
    </div>
  );
}

export default Login;