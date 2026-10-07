import { useState, useEffect } from "react";
import "../style/Reading.css";


function Reading() {
  const [difficulty, setDifficulty] = useState("Easy");
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(0.9);
  const [speaking, setSpeaking] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const [paragraph, setParagraph] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const words = paragraph.split(" ");


  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setActiveWord(null);
  };

  
  const speakAll = () => {
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(paragraph);
    utterance.rate = speed;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };


  const handleWordClick = (word, index) => {
    const clean = word.replace(/[^\w]/g, "");
    if (!clean) return;

    stopSpeech();
    setActiveWord(index);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = speed;
    utterance.onend = () => setActiveWord(null);
    utterance.onerror = () => setActiveWord(null);
    window.speechSynthesis.speak(utterance);
  };

 async function startReading() {
  setLoading(true);
  setError("");

  try {
    const response = await fetch(
      "http://localhost:5000/api/generate-reading",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          difficulty: difficulty
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate passage.");
    }

    setParagraph(data.paragraph);
    setStarted(true);

  } catch (error) {
    console.error("Generation error:", error);
    setError(error.message || "Cannot generate reading passage.");
  } finally {
    setLoading(false);
  }
}

  function logout() {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      stopSpeech();
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
              >Easy</button>
              <button
                className={difficulty === "Medium" ? "selected" : ""}
                onClick={() => setDifficulty("Medium")}
              >Medium</button>
              <button
                className={difficulty === "Hard" ? "selected" : ""}
                onClick={() => setDifficulty("Hard")}
              >Hard</button>
            </div>

            <p className="selected-difficulty">
              Selected: <strong>{difficulty}</strong>
            </p>

            <button className="start-button" onClick={startReading} disabled={loading}>
              Start Reading  {loading ? "Generating..." : "Start Reading"}
            </button>
          </div>
        ) : (
          <div className="reading-card">
            <div className="reading-title">
              <span>{difficulty}</span>
              <h2>Reading Passage</h2>
            </div>

           
                    <div className="speed-button">
            <span>Speed:</span>
            <button
              className={`speed-tap ${speed === 0.6 ? "active" : ""}`}
              onClick={() => setSpeed(0.6)}
            >
              Slow
            </button>

            <button
              className={`speed-tap ${speed === 1.0 ? "active" : ""}`}
              onClick={() => setSpeed(1.0)}
            >
              Normal
            </button>

            <button
              className={`speed-tap ${speed === 1.5 ? "active" : ""}`}
              onClick={() => setSpeed(1.5)}
            >
              Fast
            </button>
          </div>

            <div className="paragraph">
              {words.map((word, index) => (
                <span
                  key={index}
                  className={`clickable-word ${activeWord === index ? "active" : ""}`}
                  onClick={() => handleWordClick(word, index)}
                >
                  {word}{" "}
                </span>
              ))}
            </div>

            <div className="reading-actions">
              <button
                className="back-button"
                onClick={() => {
                  stopSpeech();
                  setStarted(false);
                }}
              >
                Back
              </button>

              {speaking ? (
                <button className="read-button" onClick={stopSpeech}>
                  ⏹ Stop
                </button>
              ) : (
          <button className="read-button" onClick={speakAll}>
                  🎤 Start Reading
                </button>
              )}
              {error && <p className="error-message">{error}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Reading;