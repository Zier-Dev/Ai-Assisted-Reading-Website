import { useState } from "react";
import "../style/Register.css";

function Register({ onGoToLogin }) {
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role] = useState("Student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    // Validation inside the submit handler
    if (!name || !fullName || !password || !role) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: name,
          full_name: fullName,
          password: password,
          role: role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect or notify user on successful registration
        if (onGoToLogin) onGoToLogin();
      } else {
        setError(data.error || "Registration failed.");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  }

  function handleBackToLogin(event) {
    event.preventDefault();
    setError(""); 
    if (onGoToLogin) onGoToLogin();
  }

  return (
    <div className="register-box">
        
      <h2>Register</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleRegister}>
        <label>
          Username:
          <input
            type="text"
            placeholder="Username"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
          />
        </label>

        <label>
          Full Name:
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={loading}
          />
        </label>

        <label>
          Password:
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
          />
        </label>

        <p>Role: {role}</p>

        <button className="submit_btn" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Submit"}
        </button>

        <button className="back_btn" type="button" onClick={handleBackToLogin}>Back to Login</button>
      </form>
    </div>
  );
}

export default Register;