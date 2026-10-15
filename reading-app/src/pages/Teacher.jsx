
import React, { useState } from "react";
import "../style/Teacher.css";

function Teacher({ user, onLogout }) {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [students] = useState([
    {
      id: 1,
      name: "Juan Dela Cruz",
      section: "Grade 7 - Rizal",
      history: [
        {
          date: "October 14, 2026",
          time: "9:30 AM",
          difficulty: "Easy",
          status: "Completed",
     
        },
        {
          date: "October 13, 2026",
          time: "10:15 AM",
          difficulty: "Medium",
          status: "Completed",

        }
      ]
    },
    {
      id: 2,
      name: "Maria Santos",
      section: "Grade 7 - Bonifacio",
      history: [
        {
          date: "October 14, 2026",
          time: "11:00 AM",
          difficulty: "Hard",
          status: "Completed",
         
        }
      ]
    },
    {
      id: 3,
      name: "Pedro Reyes",
      section: "Grade 7 - Rizal",
      history: []
    }
  ]);

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPractices = students.reduce(
    (total, student) => total + student.history.length,
    0
  );

  const completedStudents = students.filter(
    (student) => student.history.length > 0
  ).length;

  const averageScore = (() => {
    const scores = students.flatMap((student) =>
      student.history
        .map((practice) => practice.score)
        .filter((score) => typeof score === "number")
    );

    return scores.length
      ? Math.round(
          scores.reduce((total, score) => total + score, 0) /
            scores.length
        )
      : 0;
  })();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
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
            Welcome, {user?.first_name || user?.name || "Teacher"}!
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

        {/* Student list */}
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
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
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
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="4" className="teacher-empty">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Selected student's history */}
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
                  {selectedStudent.history.map((practice, index) => (
                    <tr key={index}>
                      <td>{practice.date}</td>
                      <td>{practice.time}</td>
                      <td>{practice.difficulty}</td>
                      <td>
                        <span className="teacher-status">
                          {practice.status}
                        </span>
                      </td>
                     
                    </tr>
                  ))}

                  {selectedStudent.history.length === 0 && (
                    <tr>
                      <td colSpan="5" className="teacher-empty">
                        This student has no recorded reading practices.
                      </td>
                    </tr>
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
