
import { useState, useEffect } from "react";
import "../style/Reading.css";

function Reading() {
  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const [user] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [difficulty, setDifficulty] = useState("Easy");
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(0.9);
  const [speaking, setSpeaking] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const [paragraph, setParagraph] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Teacher assignment modal states
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [savingTeacher, setSavingTeacher] = useState(false);
  const [teacherError, setTeacherError] = useState("");

  const words = paragraph.split(/\s+/).filter(Boolean);
  const userId = user?.user_id ?? user?.id;

  // Check if the student already has an assigned teacher
  useEffect(() => {
    if (!userId || user?.role !== "Student") return;

    let cancelled = false;

    async function checkTeacher() {
      try {
        const response = await fetch(
          `${API_URL}/api/students/${userId}/teacher`
        );

        if (!response.ok) {
          throw new Error("Failed to check your teacher assignment.");
        }

        const data = await response.json();

        if (cancelled) return;

        // No assigned teacher: load teachers and open the modal
        if (!data.teacher_id) {
          const teacherResponse = await fetch(
            `${API_URL}/api/teachers`
          );

          if (!teacherResponse.ok) {
            throw new Error("Failed to load the list of teachers.");
          }

              const teacherData = await teacherResponse.json();

          console.log("Backend teacher data:", teacherData);

          if (cancelled) return;

          const teacherList = Array.isArray(teacherData)
            ? teacherData
            : teacherData.teachers || teacherData.rows || [];

          console.log("Parsed teacher list:", teacherList);

          setTeachers(teacherList);
          setShowTeacherModal(true);

          if (teacherList.length === 0) {
            setTeacherError("No teachers found.");
}

          if (teacherList.length === 0) {
            setTeacherError(
              "No teachers are available yet. Please contact your administrator."
            );
          }
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Teacher assignment error:", err);
        setTeacherError(
          err.message || "Unable to check your teacher assignment."
        );
        setShowTeacherModal(true);
      }
    }

    checkTeacher();

    return () => {
      cancelled = true;
    };
  }, [API_URL, userId, user?.role]);

  // Stop speech when leaving the page
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
    if (!paragraph) return;

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(paragraph);
    utterance.rate = speed;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleWordClick = (word, index) => {
    const clean = word.replace(/[^\w'-]/g, "");
    if (!clean) return;

    stopSpeech();
    setActiveWord(index);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = speed;

    utterance.onend = () => setActiveWord(null);
    utterance.onerror = () => setActiveWord(null);

    window.speechSynthesis.speak(utterance);
  };

  // Generate a reading passage
  async function startReading() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/generate-reading`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ difficulty }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate passage."
        );
      }

      if (!data.paragraph || !data.paragraph.trim()) {
        throw new Error(
          "The AI returned an empty passage. Try again."
        );
      }

      setParagraph(data.paragraph.trim());
      setStarted(true);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "Cannot generate reading passage.");
    } finally {
      setLoading(false);
    }
  }

  // Save the student's selected teacher
  const handleTeacherSelection = async () => {
    if (!selectedTeacher) {
      setTeacherError("Please select a teacher first.");
      return;
    }

    if (!userId) {
      setTeacherError("Your account information is missing. Please log in again.");
      return;
    }

    try {
      setSavingTeacher(true);
      setTeacherError("");

      const response = await fetch(
        `${API_URL}/api/students/${userId}/teacher`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacher_id: selectedTeacher,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Failed to assign teacher."
        );
      }

      setShowTeacherModal(false);
      setSelectedTeacher("");
      setTeacherError("");
    } catch (err) {
      console.error("Teacher selection error:", err);
      setTeacherError(
        err.message || "Something went wrong while saving your teacher."
      );
    } finally {
      setSavingTeacher(false);
    }
  };

  function logout() {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (confirmLogout) {
      stopSpeech();
      sessionStorage.removeItem("user");
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
          <p>Practice your reading by choosing a difficulty level.</p>
        </div>

        {!started ? (
          <div className="reading-card">
            <h2>Choose Difficulty</h2>

            <div className="difficulty-buttons">
              {["Easy", "Medium", "Hard"].map((level) => (
                <button
                  key={level}
                  className={difficulty === level ? "selected" : ""}
                  onClick={() => setDifficulty(level)}
                  disabled={loading || showTeacherModal}
                >
                  {level}
                </button>
              ))}
            </div>

            <p className="selected-difficulty">
              Selected: <strong>{difficulty}</strong>
            </p>

            {error && <p className="error-message">{error}</p>}

            <button
              className="start-button"
              onClick={startReading}
              disabled={loading || showTeacherModal}
            >
              {loading ? "Generating..." : "Start Reading"}
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
                  className={`clickable-word ${
                    activeWord === index ? "active" : ""
                  }`}
                  onClick={() => handleWordClick(word, index)}
                >
                  {word}{" "}
                </span>
              ))}
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="reading-actions">
              <button
                className="back-button"
                onClick={() => {
                  stopSpeech();
                  setError("");
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
                  🔊 Listen
                </button>
              )}

              <button
                className="start-button"
                onClick={startReading}
                disabled={loading}
              >
                {loading ? "Generating..." : "New Passage"}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Teacher assignment modal */}
      {showTeacherModal && (
        <div className="teacher-modal-overlay">
          <div
            className="teacher-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-modal-title"
          >
            <h2 id="teacher-modal-title">Select Your Teacher</h2>

            <p>
              You don't have an assigned teacher yet.
              Please select your teacher to continue.
            </p>

            <select
              value={selectedTeacher}
              onChange={(event) => setSelectedTeacher(event.target.value)}
              disabled={savingTeacher}
            >
              <option value="">-- Choose a teacher --</option>

              {teachers.map((teacher) => (
                <option
                  key={teacher.user_id}
                  value={teacher.user_id}
                >
                  {teacher.full_name}
                </option>
              ))}
            </select>

            {teacherError && (
              <p className="teacher-modal-error">{teacherError}</p>
            )}

            <button
              onClick={handleTeacherSelection}
              disabled={savingTeacher || teachers.length === 0}
            >
              {savingTeacher ? "Saving..." : "Confirm Teacher"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reading;
