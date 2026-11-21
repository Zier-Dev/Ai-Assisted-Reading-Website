import React, { useState, useEffect } from "react";

import "../style/Teacher.css";

import { LogOut } from "lucide-react";

function Teacher({ user, onLogout }) {
  const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const teacherId = user?.user_id ?? user?.id;

  const [search, setSearch] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [students, setStudents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Assessment management states
  const [assessments, setAssessments] = useState([]);
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [showAssignAssessment, setShowAssignAssessment] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [assessmentParagraph, setAssessmentParagraph] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [assigningStudent, setAssigningStudent] = useState(null);
  const [assessmentError, setAssessmentError] = useState("");
  const [assessmentSaving, setAssessmentSaving] = useState(false);

  // Section states

  const [section, setSection] = useState("");

  const [sectionInput, setSectionInput] = useState("");

  const [sectionModalOpen, setSectionModalOpen] = useState(false);

  const [sectionLoading, setSectionLoading] = useState(true);

  const [sectionSaving, setSectionSaving] = useState(false);

  const [sectionError, setSectionError] = useState("");

  // Fetch the teacher's section.

  useEffect(() => {
    if (!teacherId || user?.role !== "Teacher") {
      setSectionLoading(false);

      return;
    }

    const controller = new AbortController();

    async function fetchSection() {
      setSectionLoading(true);

      setSectionError("");

      try {
        const response = await fetch(
          `${API_URL}/api/teachers/${teacherId}/section`,

          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to load your section.");
        }

        const data = await response.json();

        const savedSection = data.section || "";

        setSection(savedSection);

        setSectionInput(savedSection);

        // Require the teacher to set a section if none exists.

        if (!savedSection.trim()) {
          setSectionModalOpen(true);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching teacher section:", err);

          setSectionError(err.message || "Unable to load your section.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setSectionLoading(false);
        }
      }
    }

    fetchSection();

    return () => controller.abort();
  }, [API_URL, teacherId, user?.role]);

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

          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to load your students.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Invalid student data received.");
        }

        const formattedStudents = data.map((student) => ({
          id: student.user_id,

          name: student.full_name || "Unnamed Student",

          section: student.section || "Not specified",

          history: Array.isArray(student.history) ? student.history : [],
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

  // Load assessments created by this teacher.
  useEffect(() => {
    if (!teacherId || user?.role !== "Teacher") return;

    const controller = new AbortController();

    async function fetchAssessments() {
      try {
        const response = await fetch(
          `${API_URL}/api/teachers/${teacherId}/assessments`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to load assessments.");
        setAssessments(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Fetch assessments error:", err);
          setAssessmentError(err.message || "Failed to load assessments.");
        }
      }
    }

    fetchAssessments();
    return () => controller.abort();
  }, [API_URL, teacherId, user?.role]);

  const handleCreateAssessment = async (event) => {
    event.preventDefault();
    const title = assessmentTitle.trim();
    const paragraph = assessmentParagraph.trim();

    if (!title || !paragraph) {
      setAssessmentError("Please enter both a title and a paragraph.");
      return;
    }

    try {
      setAssessmentSaving(true);
      setAssessmentError("");
      const response = await fetch(
        `${API_URL}/api/teachers/${teacherId}/assessments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, paragraph }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to create assessment.");

      setAssessments((current) => [data.assessment, ...current]);
      setAssessmentTitle("");
      setAssessmentParagraph("");
      setShowAddAssessment(false);
    } catch (err) {
      console.error("Create assessment error:", err);
      setAssessmentError(err.message || "Failed to create assessment.");
    } finally {
      setAssessmentSaving(false);
    }
  };

  const openAssignAssessment = (student) => {
    setAssigningStudent(student);
    setSelectedAssessmentId("");
    setAssessmentError("");
    setShowAssignAssessment(true);
  };

  const handleAssignAssessment = async (event) => {
    event.preventDefault();
    if (!assigningStudent || !selectedAssessmentId) {
      setAssessmentError("Please choose an assessment.");
      return;
    }

    try {
      setAssessmentSaving(true);
      setAssessmentError("");
      const response = await fetch(
        `${API_URL}/api/students/${assigningStudent.id}/assessments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacher_id: teacherId,
            assessment_id: Number(selectedAssessmentId),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to assign assessment.");

      setShowAssignAssessment(false);
      setAssigningStudent(null);
      setSelectedAssessmentId("");
      alert("Assessment assigned successfully.");
    } catch (err) {
      console.error("Assign assessment error:", err);
      setAssessmentError(err.message || "Failed to assign assessment.");
    } finally {
      setAssessmentSaving(false);
    }
  };

  // Search students by name.

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Calculate dashboard statistics.

  const totalPractices = students.reduce(
    (total, student) => total + student.history.length,

    0,
  );

  const completedStudents = students.filter(
    (student) => student.history.length > 0,
  ).length;

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  // Open the section editor.

  const handleEditSection = () => {
    setSectionInput(section);

    setSectionError("");

    setSectionModalOpen(true);
  };

  // Save the teacher's section and update the assigned students.

  const handleSaveSection = async (event) => {
    event.preventDefault();

    const newSection = sectionInput.trim();

    if (!newSection) {
      setSectionError("Please enter a section.");

      return;
    }

    setSectionSaving(true);

    setSectionError("");

    try {
      const response = await fetch(
        `${API_URL}/api/teachers/${teacherId}/section`,

        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({ section: newSection }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save your section.");
      }

      setSection(newSection);

      // Update the displayed section for all assigned students.

      setStudents((currentStudents) =>
        currentStudents.map((student) => ({
          ...student,

          section: newSection,
        })),
      );

      // Keep the selected student's history heading up to date.

      setSelectedStudent((currentStudent) =>
        currentStudent ? { ...currentStudent, section: newSection } : null,
      );

      setSectionModalOpen(false);
    } catch (err) {
      console.error("Save section error:", err);

      setSectionError(err.message || "Unable to save your section.");
    } finally {
      setSectionSaving(false);
    }
  };

  const handleRemoveStudent = async (studentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this student from your assigned students?",
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/teachers/${teacherId}/students/${studentId}`,

        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove student.");
      }

      setStudents((currentStudents) =>
        currentStudents.filter((student) => student.id !== studentId),
      );

      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }

      alert("Student successfully unassigned.");
    } catch (err) {
      console.error("Remove student error:", err);

      alert(err.message || "Failed to remove student.");
    }
  };

  const handleDeleteAllHistory = async (studentId) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete all reading history of this student? This action cannot be undone."
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/api/students/${studentId}/reading-attempts`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete reading history.");
    }

    // Clear the history in the student list.
    setStudents((currentStudents) =>
      currentStudents.map((student) =>
        student.id === studentId
          ? { ...student, history: [] }
          : student
      )
    );

    // Clear the currently displayed history.
    setSelectedStudent((currentStudent) =>
      currentStudent && currentStudent.id === studentId
        ? { ...currentStudent, history: [] }
        : currentStudent
    );

    alert("All reading history deleted successfully.");
  } catch (error) {
    console.error("Delete history error:", error);
    alert(error.message || "Failed to delete reading history.");
  }
};

  return (
    <div className="teacher-page">
      <header className="teacher-header">
        <div className="teacher-brand">
          <img
            src="/src/assets/School_Logo_cropped.png"
            alt="School Logo"
            className="school-logo-teacher"
          />

          <div>
            <h1>Teacher Dashboard</h1>

            <p>Medroso-Mendoza National High School</p>
          </div>
        </div>

        <button className="teacher-logout" onClick={handleLogout}>
          <LogOut size={15}> </LogOut> Logout
        </button>
      </header>

      <main className="teacher-content">
        <section className="teacher-welcome">
          <h2>
            Welcome,{" "}
            {user?.full_name || user?.first_name || user?.name || "Teacher"}!
          </h2>

          <p>Monitor your students' reading practice and progress.</p>

          

          {/* New section information and button */}

          <div className="teacher-section-controls">
            <p>
              Section:{" "}
              <strong>
                {sectionLoading ? "Loading..." : section || "Not set"}
              </strong>
            </p>
            <button
            type="button"
            className="teacher-section-button"
            onClick={() => {
              setAssessmentError("");
              setShowAddAssessment(true);
            }}
          >
            Add Assessment
          </button>

            <button
              type="button"
              className="teacher-section-button"
              onClick={handleEditSection}
              disabled={sectionLoading}
            >
              Edit Section
            </button>
          </div>

          {sectionError && !sectionModalOpen && (
            <p className="teacher-section-error">{sectionError}</p>
          )}
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

                  <th>Assessment</th>

                  <th></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="teacher-empty">
                      Loading students...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="teacher-empty">
                      {error}
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="teacher-empty">
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
                          className="teacher-view-button"
                          onClick={() => openAssignAssessment(student)}
                        >
                          Assign Assessment
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
                className="teacher-clear-history-button"
                onClick={() => handleDeleteAllHistory(selectedStudent.id)}
                disabled={selectedStudent.history.length === 0}
              >
                Delete All History
              </button>

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

      {/* Section setup/edit modal */}

      {showAddAssessment && (
        <div
          className="teacher-section-overlay"
          onClick={() => !assessmentSaving && setShowAddAssessment(false)}
        >
          <div
            className="teacher-section-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Add Assessment</h2>
            <form onSubmit={handleCreateAssessment}>
              <label htmlFor="assessment-title">Assessment Title</label>
              <input
                id="assessment-title"
                type="text"
                value={assessmentTitle}
                onChange={(event) => setAssessmentTitle(event.target.value)}
                placeholder="Enter assessment title"
                maxLength={255}
                required
              />
              <label htmlFor="assessment-paragraph">Paragraph</label>
              <textarea
                id="assessment-paragraph"
                value={assessmentParagraph}
                onChange={(event) => setAssessmentParagraph(event.target.value)}
                placeholder="Type or paste the reading paragraph..."
                rows={7}
                required
              />
              {assessmentError && (
                <p className="teacher-section-error">{assessmentError}</p>
              )}
              <div className="teacher-section-modal-actions">
                <button
                  type="button"
                  className="teacher-section-cancel"
                  onClick={() => setShowAddAssessment(false)}
                  disabled={assessmentSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="teacher-section-save"
                  disabled={assessmentSaving}
                >
                  {assessmentSaving ? "Saving..." : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignAssessment && assigningStudent && (
        <div
          className="teacher-section-overlay"
          onClick={() => !assessmentSaving && setShowAssignAssessment(false)}
        >
          <div
            className="teacher-section-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Assign Assessment</h2>
            <p>Choose an assessment for {assigningStudent.name}.</p>
            <form onSubmit={handleAssignAssessment}>
              <label htmlFor="assign-assessment-select">Assessment</label>
              <select
                id="assign-assessment-select"
                value={selectedAssessmentId}
                onChange={(event) =>
                  setSelectedAssessmentId(event.target.value)
                }
                required
              >
                <option value="">-- Choose an assessment --</option>
                {assessments.map((assessment) => (
                  <option
                    key={assessment.assessment_id}
                    value={assessment.assessment_id}
                  >
                    {assessment.title}
                  </option>
                ))}
              </select>
              {assessments.length === 0 && (
                <p className="teacher-section-error">
                  You haven't created any assessments yet.
                </p>
              )}
              {assessmentError && (
                <p className="teacher-section-error">{assessmentError}</p>
              )}
              <div className="teacher-section-modal-actions">
                <button
                  type="button"
                  className="teacher-section-cancel"
                  onClick={() => setShowAssignAssessment(false)}
                  disabled={assessmentSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="teacher-section-save"
                  disabled={assessmentSaving || assessments.length === 0}
                >
                  {assessmentSaving ? "Assigning..." : "Assign Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {sectionModalOpen && (
        <div
          className="teacher-section-overlay"
          onClick={() => {
            // A teacher cannot dismiss the modal until a section is saved.

            if (section.trim()) {
              setSectionModalOpen(false);
            }
          }}
        >
          <div
            className="teacher-section-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-section-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="teacher-section-title">
              {section.trim() ? "Edit Section" : "Set Your Section"}
            </h2>

            <p>
              {section.trim()
                ? "Updating your section will also update the section of all your assigned students."
                : "Please set your section before continuing. Your assigned students will use this section."}
            </p>

            <form onSubmit={handleSaveSection}>
              <label htmlFor="teacher-section-input">Section Name</label>

              <input
                id="teacher-section-input"
                type="text"
                placeholder="Example: 9-Magsaysay"
                value={sectionInput}
                onChange={(event) => setSectionInput(event.target.value)}
                maxLength={100}
                required
                autoFocus
              />

              {sectionError && (
                <p className="teacher-section-error">{sectionError}</p>
              )}

              <div className="teacher-section-modal-actions">
                {section.trim() && (
                  <button
                    type="button"
                    className="teacher-section-cancel"
                    onClick={() => {
                      setSectionInput(section);

                      setSectionError("");

                      setSectionModalOpen(false);
                    }}
                    disabled={sectionSaving}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  className="teacher-section-save"
                  disabled={sectionSaving}
                >
                  {sectionSaving ? "Saving..." : "Save Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teacher;
