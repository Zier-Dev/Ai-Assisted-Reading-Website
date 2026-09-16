import { useState } from "react";
import "../style/Reading.css";

function Reading() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [started, setStarted] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  const paragraph = `
    The little boy walked to the garden early in the morning.
    He saw many colorful flowers near the trees.
    A small bird was sitting on a branch and singing.
    The boy smiled and enjoyed the quiet morning.
  `;

  function startReading() {
    setStarted(true);
  }

  function logout() {
     const confirmLogout = window.confirm('Are you sure you want to logout?');
      if (confirmLogout) {
    localStorage.removeItem("user");
    window.location.href = "/";
      }
  }

  return (
    <div className="reading-page">

      <header className="reading-header">
        <div>
          <h1>Reading System</h1>
          <p>Medroso-Mendoza National High School</p>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="reading-content">

        <div className="welcome">
          <h2>
            Welcome, {user?.first_name || user?.name || "Student"}!
          </h2>

          <p>
            Practice your reading by choosing a difficulty level.
          </p>
        </div>

        {!started ? (
          <div className="reading-card">

            <h2>Choose Difficulty</h2>

            <div className="difficulty-buttons">

              <button
                className={difficulty === "Easy" ? "selected" : ""}
                onClick={() => setDifficulty("Easy")}
              >
                Easy
              </button>

              <button
                className={difficulty === "Medium" ? "selected" : ""}
                onClick={() => setDifficulty("Medium")}
              >
                Medium
              </button>

              <button
                className={difficulty === "Hard" ? "selected" : ""}
                onClick={() => setDifficulty("Hard")}
              >
                Hard
              </button>

            </div>

            <p className="selected-difficulty">
              Selected: <strong>{difficulty}</strong>
            </p>

            <button
              className="start-button"
              onClick={startReading}
            >
              Start Reading
            </button>

          </div>
        ) : (

          <div className="reading-card">

            <div className="reading-title">
              <span>{difficulty}</span>
              <h2>Morning in the Garden</h2>
            </div>

            <div className="paragraph">
              <p>{paragraph}</p>
            </div>

            <div className="reading-actions">

              <button
                className="back-button"
                onClick={() => setStarted(false)}
              >
                Back
              </button>

              <button className="read-button">
                🎤 Start Reading
              </button>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default Reading;