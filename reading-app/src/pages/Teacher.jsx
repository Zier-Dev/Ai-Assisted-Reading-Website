
import React, { useState, useEffect } from "react";
import "../style/Teacher.css";

function Teacher({ user, onLogout }) {
  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const teacherId = user?.user_id ?? user?.id;

  // Fetch only students assigned to this teacher.
  useEffect(() => {
    if (!teacherId || user?.role !== "Teacher") {
      setStudents([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchStudents() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/api/teachers/${teacherId}/students`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load your students.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid student data received.");
        }

        // Match the database fields and prepare safe defaults.
        const formattedStudents = data.map((student) => ({
          id: student.user_id,
          name: student.full_name || "Unnamed Student",
          section: student.section || "Not specified",
          history: Array.isArray(student.history)
            ? student.history
            : [],
        }));

        setStudents(formattedStudents);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching students:", err);
          setError(err.message || "Unable to load students.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchStudents();

    return () => controller.abort();
  }, [API_URL, teacherId, user?.role]);

  // Search students by name.
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate dashboard statistics.
  const totalPractices = students.reduce(
    (total, student) => total + student.history.length,
    0
  );

  const completedStudents = students.filter(
    (student) => student.history.length > 0
  ).length;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };


  const handleRemoveStudent = async (studentId) => {
  const confirmed = window.confirm(
    "Are you sure you want to remove this student from your assigned students?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/teachers/${teacherId}/students/${studentId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to remove student.");
    }

    // Remove the student from the displayed list
    setStudents((currentStudents) =>
      currentStudents.filter((student) => student.id !== studentId)
    );

    // Close the student's details if currently selected
    if (selectedStudent?.id === studentId) {
      setSelectedStudent(null);
    }

    alert("Student successfully unassigned.");
  } catch (error) {
    console.error("Remove student error:", error);
    alert(error.message || "Failed to remove student.");
  }
};
  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div>
          <h1>Teacher Dashboard</h1>
          <p>Medroso-Mendoza National High School</p>
        </div>

        <button className="teacher-logout" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="teacher-content">
        <section className="teacher-welcome">
          <h2>
            Welcome,{" "}
            {user?.full_name || user?.first_name || user?.name || "Teacher"}!
          </h2>
          <p>Monitor your students' reading practice and progress.</p>
        </section>

        {/* Dashboard statistics */}
        <section className="teacher-stats">
          <div className="teacher-stat-card">
            <h3>Total Students</h3>
            <p>{students.length}</p>
          </div>

          <div className="teacher-stat-card">
            <h3>Total Practices</h3>
            <p>{totalPractices}</p>
          </div>

          <div className="teacher-stat-card">
            <h3>Students Practiced</h3>
            <p>{completedStudents}</p>
          </div>
        </section>

        {/* Assigned student list */}
        <section className="teacher-card">
          <h2>My Students</h2>
          <p className="teacher-description">
            Select a student to view their reading practice history.
          </p>

          <input
            className="teacher-search"
            type="text"
            placeholder="Search student name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="teacher-table-wrapper">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Section</th>
                  <th>Total Practices</th>
                  <th>Action</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="teacher-empty">
                      Loading students...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="4" className="teacher-empty">
                      {error}
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="teacher-empty">
                      {search
                        ? "No students match your search."
                        : "No students assigned to you yet."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.section}</td>
                      <td>{student.history.length}</td>
                      <td>
                        <button
                          className="teacher-view-button"
                          onClick={() => setSelectedStudent(student)}
                        >
                          View History
                        </button>
                        
                      </td>

                      <td>
                        <button
                          className="teacher-remove-button"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          Remove Student
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected student's reading history */}
        {selectedStudent && (
          <section className="teacher-card teacher-history">
            <div className="teacher-history-heading">
              <div>
                <h2>Reading Practice History</h2>
                <p>
                  {selectedStudent.name} — {selectedStudent.section}
                </p>
              </div>

              <button
                className="teacher-back-button"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </button>
            </div>

            <div className="teacher-table-wrapper">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedStudent.history.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="teacher-empty">
                        No reading practice records are available yet.
                      </td>
                    </tr>
                  ) : (
                    selectedStudent.history.map((practice, index) => (
                      <tr key={practice.id ?? index}>
                        <td>{practice.date || "—"}</td>
                        <td>{practice.time || "—"}</td>
                        <td>{practice.difficulty || "—"}</td>
                        <td>
                          <span className="teacher-status">
                            {practice.status || "Completed"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default Teacher;
