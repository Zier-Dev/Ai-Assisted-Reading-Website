import { useState } from "react";
import "../style/Reading.css";
import { useSpeech } from "react-text-to-speech";

function Reading() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [started, setStarted] = useState(false);
   const [speed, setSpeed] = useState(0.9);

  const user = JSON.parse(localStorage.getItem("user"));

  const paragraph = `The little boy walked to the garden early in the morning. He saw many colorful flowers near the trees. A small bird was sitting on a branch and singing. The boy smiled and enjoyed the quiet morning.`;

  const { Text, speechStatus, start, pause, stop } = useSpeech({
    text: paragraph,
    stableText: true,
    rate: speed,
  });

  const words = paragraph.split(" ");

  function startReading() {
    setStarted(true);
  }

  function logout() {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      stop();
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  }

  const handleWordClick = (word) => {
    const clean = word.replace(/[^\w]/g, "");
    if (!clean) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

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
          <h2>Welcome, {user?.first_name || user?.name || "Student"}!</h2>
          <p>Practice your reading by choosing a difficulty level.</p>
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

            <button className="start-button" onClick={startReading}>
              Start Reading
            </button>
          </div>
        ) : (
          <div className="reading-card">
            <div className="reading-title">
              <span>{difficulty}</span>
              <button onClick={() => setSpeed(1.2)}>Fast</button>
              <button onClick={() => setSpeed(0.7)}>Slow</button>
              <h2>Morning in the Garden</h2>
            </div>

            <div className="paragraph">
              {words.map((word, index) => (
                <span
                  key={index}
                  className="clickable-word"
                  onClick={() => handleWordClick(word)}
                >
                  {word}{" "}
                </span>
              ))}
            </div>

            <div className="reading-actions">
              <button
                className="back-button"
                onClick={() => {
                  stop();
                  setStarted(false);
                }}
              >
                Back
              </button>

              {speechStatus === "started" ? (
                <button className="read-button" onClick={pause}>
                  ⏸ Pause
                </button>
              ) : (
                <button className="read-button" onClick={start}>
                  🎤 Start Reading
                </button>
              )}

              {speechStatus === "started" && (
                <button className="read-button" onClick={stop}>
                  ⏹ Stop
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Reading;