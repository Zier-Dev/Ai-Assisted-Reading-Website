
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const Groq = require("groq-sdk");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const pool = require("./db/pool");
const app = express();
const PORT = process.env.PORT || 5000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(cors());
app.use(express.json());

// GET ALL USERS
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM users ORDER BY user_id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { user, password, role } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE "user" = $1',
      [user]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const userData = result.rows[0];

    let isPasswordValid = false;

    try {
      isPasswordValid = await bcrypt.compare(
        password,
        userData.password
      );
    } catch {
      isPasswordValid = userData.password === password;
    }

    if (!isPasswordValid && userData.password !== password) {
      return res.status(401).json({ error: "Wrong password" });
    }

    if (role && userData.role !== role) {
      return res.status(403).json({ error: "Role mismatch" });
    }

    // Return both ID property names for compatibility.
    res.json({
      success: true,
      user: {
        id: userData.user_id,
        user_id: userData.user_id,
        username: userData.user,
        name: userData.full_name,
        full_name: userData.full_name,
        role: userData.role,
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed." });
  }
});

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { user, full_name, password, role } = req.body;

    if (!user || !full_name || !password || !role) {
      return res.status(400).json({
        error: "Missing required fields.",
      });
    }

    const allowedRoles = ["Student", "Teacher", "Admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role.",
      });
    }

    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE LOWER("user") = LOWER($1)',
      [user]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        error: "Username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users ("user", full_name, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, "user", full_name, role`,
      [user, full_name, hashedPassword, role]
    );

    const newUser = result.rows[0];

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser.user_id,
        user_id: newUser.user_id,
        username: newUser.user,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      error: error.message || "Internal server error.",
    });
  }
});

// DELETE USER
app.delete("/api/users/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM users WHERE user_id = $1 RETURNING user_id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET ALL TEACHERS
app.get("/api/teachers", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, full_name
       FROM users
       WHERE role = $1
       ORDER BY full_name`,
      ["Teacher"]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get teachers error:", error);
    res.status(500).json({
      message: "Failed to load teachers.",
    });
  }
});

// GET A STUDENT'S ASSIGNED TEACHER
app.get("/api/students/:id/teacher", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        message: "Invalid student ID.",
      });
    }

    const result = await pool.query(
      `SELECT teacher_id
       FROM users
       WHERE user_id = $1
         AND role = $2`,
      [studentId, "Student"]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    res.json({
      teacher_id: result.rows[0].teacher_id,
    });
  } catch (error) {
    console.error("Check teacher error:", error);
    res.status(500).json({
      message: "Failed to check teacher assignment.",
    });
  }
});

// ASSIGN A TEACHER TO A STUDENT
app.put("/api/students/:id/teacher", async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const teacherId = Number(req.body.teacher_id);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0 ||
      !Number.isInteger(teacherId) ||
      teacherId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid student or teacher ID.",
      });
    }

    // Verify the selected account has the Teacher role.
    const teacherResult = await pool.query(
      `SELECT user_id
       FROM users
       WHERE user_id = $1
         AND role = $2`,
      [teacherId, "Teacher"]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(400).json({
        message: "Selected teacher does not exist.",
      });
    }

    // Only update an account with the Student role.
  const result = await pool.query(
  `UPDATE users
   SET teacher_id = $1,
       section = (
         SELECT section
         FROM users
         WHERE user_id = $1
           AND role = 'Teacher'
       )
   WHERE user_id = $2
     AND role = $3
   RETURNING user_id, teacher_id, section`,
  [teacherId, studentId, "Student"]
);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    res.json({
      message: "Teacher assigned successfully.",
      user_id: result.rows[0].user_id,
      teacher_id: result.rows[0].teacher_id,
    });
  } catch (error) {
    console.error("Assign teacher error:", error);
    res.status(500).json({
      message: "Failed to assign teacher.",
    });
  }
});

// GENERATE READING PASSAGE
app.post("/api/generate-reading", async (req, res) => {
    const { difficulty, student_id } = req.body;
  const studentId = Number(student_id);


  try {
    const allowedDifficulties = ["Easy", "Medium", "Hard"];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: "Please select Easy, Medium, or Hard.",
      });
    }

    


     // NEW: Make sure the student ID is valid.
    if (!Number.isInteger(studentId) || studentId <= 0) {
      return res.status(400).json({
        error: "A valid student ID is required. Please log in again.",
      });
    }

    // NEW: Verify that the account exists and is a student.
    const studentResult = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1 AND role = $2",
      [studentId, "Student"]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Student account not found.",
      });
    }

    // NEW: Search for the oldest passage the student has NOT read.
    // It only searches passages matching the selected difficulty.
    const unreadResult = await pool.query(
      `SELECT rp.passage_id, rp.difficulty, rp.paragraph
       FROM reading_passages rp
       WHERE rp.difficulty = $1
         AND NOT EXISTS (
           SELECT 1
           FROM student_passage_reads spr
           WHERE spr.student_id = $2
             AND spr.passage_id = rp.passage_id
         )
       ORDER BY rp.passage_id ASC
       LIMIT 1`,
      [difficulty, studentId]
    );

    // NEW: If an unread passage exists, display it immediately.
    // No AI generation is needed.
    if (unreadResult.rows.length > 0) {
      const passage = unreadResult.rows[0];

      return res.json({
        success: true,
        source: "database",
        passage_id: passage.passage_id,
        difficulty: passage.difficulty,
        paragraph: passage.paragraph,
      });
    }

    // NEW: No unread passage exists.
    // Retrieve ALL existing passages so the AI can avoid repeating them.
    const existingResult = await pool.query(
      `SELECT passage_id, difficulty, paragraph
       FROM reading_passages
       ORDER BY passage_id ASC`
    );

    const existingPassages = existingResult.rows;

    // NEW: Convert the existing database passages into text
    // that can be included in the AI prompt.
    const previousPassagesText = existingPassages.length
      ? existingPassages
          .map(
            (passage, index) =>
              `PASSAGE ${index + 1} (ID: ${passage.passage_id}, DIFFICULTY: ${passage.difficulty}):\n${passage.paragraph}`
          )
          .join("\n\n")
      : "There are currently no passages in the database.";

    // NEW: Helper function to get the first sentence.
    // This helps detect repeated opening sentences.
    const getFirstSentence = (text) => {
      const match = text.match(/^.*?[.!?](?:\s|$)/);
      return (match ? match[0] : text).trim().toLowerCase();
    };

    // NEW: Normalize text before comparing passages.
    const normalizeText = (text) =>
      text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    let paragraph = "";
    let accepted = false;

    // NEW: Give the AI up to 3 attempts to produce a different passage.
    for (let attempt = 1; attempt <= 3; attempt++) {
      const prompt = `
Write ONE original English reading passage for a high school student.

REQUIRED DIFFICULTY: ${difficulty}
LENGTH: 80 to 120 words.

The following passages are the complete existing passage collection in the database.
READ ALL OF THEM before writing. Your new passage must have a DIFFERENT main topic,
situation, setting, characters, and events. Do not rewrite, paraphrase, imitate,
or continue any of these passages.

EXISTING DATABASE PASSAGES:
${previousPassagesText}

STRICT RULES:
- Choose a main topic that is not already represented in the existing passages.
- Do not use the same opening sentence or a similar opening structure.
- Avoid repeating the same common settings, events, and story patterns.
- Do not default to a town, sunrise, morning, school, children walking, or a new day.
- Easy: use simple vocabulary and short sentences.
- Medium: use moderately longer sentences and varied vocabulary.
- Hard: use longer sentences and more advanced vocabulary, but keep it understandable.
- Make it suitable for reading aloud.
- Do not include a title, questions, answers, explanations, bullets, numbering, or dashes.
- Return only the passage.
`;

      // Existing Groq API is retained.
      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        reasoning_effort: "low",
        max_completion_tokens: 1000,
        temperature: 0.9,
      });

      const candidate = (
        typeof response.choices?.[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : ""
      ).trim();

      if (!candidate) continue;

      const candidateNormalized = normalizeText(candidate);
      const candidateFirstSentence = getFirstSentence(candidate);

      // NEW: Reject an exact duplicate passage.
      const duplicateContent = existingPassages.some(
        (passage) =>
          normalizeText(passage.paragraph) === candidateNormalized
      );

      // NEW: Reject a passage with an identical first sentence.
      const duplicateOpening = existingPassages.some(
        (passage) =>
          getFirstSentence(passage.paragraph) === candidateFirstSentence
      );

      if (!duplicateContent && !duplicateOpening) {
        paragraph = candidate;
        accepted = true;
        break;
      }
    }

    // NEW: Do not save a passage if all 3 attempts fail.
    if (!accepted || !paragraph) {
      return res.status(503).json({
        error:
          "The AI could not create a sufficiently different passage. Please try again.",
      });
    }

    // NEW: Maintain a maximum of 100 passages.
    // A transaction and advisory lock prevent simultaneous inserts
    // from exceeding the limit.
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        "SELECT pg_advisory_xact_lock($1::bigint)",
        [82461027]
      );

      const countResult = await client.query(
        "SELECT COUNT(*)::int AS total FROM reading_passages"
      );

      // NEW: If there are already 100 passages, delete the oldest.
      // ON DELETE CASCADE removes its associated student read records.
      if (countResult.rows[0].total >= 100) {
        await client.query(
          `WITH oldest AS (
             SELECT passage_id
             FROM reading_passages
             ORDER BY created_at ASC, passage_id ASC
             LIMIT 1
           )
           DELETE FROM reading_passages rp
           USING oldest
           WHERE rp.passage_id = oldest.passage_id`
        );
      }

      // NEW: Save the newly generated passage to PostgreSQL.
      const insertResult = await client.query(
        `INSERT INTO reading_passages (difficulty, paragraph)
         VALUES ($1, $2)
         RETURNING passage_id, difficulty, paragraph`,
        [difficulty, paragraph]
      );

      await client.query("COMMIT");

      const savedPassage = insertResult.rows[0];

      // Return the saved passage to Reading.jsx.
      return res.status(201).json({
        success: true,
        source: "ai",
        passage_id: savedPassage.passage_id,
        difficulty: savedPassage.difficulty,
        paragraph: savedPassage.paragraph,
      });

    } catch (databaseError) {
      await client.query("ROLLBACK");
      throw databaseError;

    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Generate/retrieve reading passage error:", error);

    res.status(500).json({
      error:
        error.message || "Failed to retrieve or generate a reading passage.",
    });
  }
});


// NEW: MARK A PASSAGE AS READ BY A STUDENT
app.post("/api/reading-passages/:passageId/read", async (req, res) => {
  const passageId = Number(req.params.passageId);
  const studentId = Number(req.body.student_id);

  try {
    // Validate the passage and student IDs.
    if (
      !Number.isInteger(passageId) ||
      passageId <= 0 ||
      !Number.isInteger(studentId) ||
      studentId <= 0
    ) {
      return res.status(400).json({
        error: "A valid student ID and passage ID are required.",
      });
    }

    // Verify the student account.
    const studentResult = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1 AND role = $2",
      [studentId, "Student"]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Student account not found.",
      });
    }

    // Verify that the passage exists.
    const passageResult = await pool.query(
      "SELECT passage_id FROM reading_passages WHERE passage_id = $1",
      [passageId]
    );

    if (passageResult.rows.length === 0) {
      return res.status(404).json({
        error: "Passage not found.",
      });
    }

    // NEW: Record that this student has read this passage.
    // ON CONFLICT prevents duplicate student-passage records.
    await pool.query(
      `INSERT INTO student_passage_reads (student_id, passage_id)
       VALUES ($1, $2)
       ON CONFLICT (student_id, passage_id) DO NOTHING`,
      [studentId, passageId]
    );

    return res.json({
      success: true,
      message: "Passage marked as read.",
    });

  } catch (error) {
    console.error("Mark passage as read error:", error);

    return res.status(500).json({
      error: error.message || "Failed to save reading progress.",
    });
  }
});


// GET A TEACHER'S ASSIGNED STUDENTS AND READING HISTORY
app.get("/api/teachers/:id/students", async (req, res) => {
  try {
    const teacherId = Number(req.params.id);

    if (!Number.isInteger(teacherId) || teacherId <= 0) {
      return res.status(400).json({
        message: "Invalid teacher ID.",
      });
    }

    const result = await pool.query(
      `SELECT
          u.user_id,
          u.full_name,
          u.section,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', ra.attempt_id,
                  'date', TO_CHAR(ra.created_at, 'YYYY-MM-DD'),
                  'time', TO_CHAR(ra.created_at, 'HH12:MI AM'),
                  'difficulty', ra.difficulty,
                  'status', 'Completed'
                )
                ORDER BY ra.created_at DESC
              )
              FROM reading_attempts ra
              WHERE ra.student_id = u.user_id
            ),
            '[]'::json
          ) AS history
       FROM users u
       WHERE u.role = $1
         AND u.teacher_id = $2
       ORDER BY u.full_name`,
      ["Student", teacherId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch assigned students error:", error);

    res.status(500).json({
      message: "Failed to fetch assigned students.",
    });
  }
});

// SAVE A READING ATTEMPT
app.post("/api/reading-attempts", async (req, res) => {
  try {
    const { student_id, difficulty } = req.body;

    const studentId = Number(student_id);

    if (
      !Number.isInteger(studentId) ||
      studentId <= 0 ||
      !["Easy", "Medium", "Hard"].includes(difficulty)
    ) {
      return res.status(400).json({
        message: "Invalid student ID or difficulty.",
      });
    }

    const student = await pool.query(
      `SELECT user_id
       FROM users
       WHERE user_id = $1
         AND role = $2`,
      [studentId, "Student"]
    );

    if (student.rows.length === 0) {
      return res.status(404).json({
        message: "Student not found.",
      });
    }

    const result = await pool.query(
      `INSERT INTO reading_attempts (student_id, difficulty)
       VALUES ($1, $2)
       RETURNING attempt_id, student_id, difficulty, created_at`,
      [studentId, difficulty]
    );

    res.status(201).json({
      message: "Reading attempt saved successfully.",
      attempt: result.rows[0],
    });
  } catch (error) {
    console.error("Save reading attempt error:", error);

    res.status(500).json({
      message: "Failed to save reading attempt.",
    });
  }
});


// REMOVE A STUDENT FROM A TEACHER
app.delete(
  "/api/teachers/:teacherId/students/:studentId",
  async (req, res) => {
    try {
      const teacherId = Number(req.params.teacherId);
      const studentId = Number(req.params.studentId);

      if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0 ||
        !Number.isInteger(studentId) ||
        studentId <= 0
      ) {
        return res.status(400).json({
          message: "Invalid teacher ID or student ID.",
        });
      }

      const result = await pool.query(
        `UPDATE users
         SET teacher_id = NULL
         WHERE user_id = $1
           AND teacher_id = $2
           AND role = $3
         RETURNING user_id, full_name`,
        [studentId, teacherId, "Student"]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          message: "Student not found or not assigned to this teacher.",
        });
      }

      res.json({
        message: "Student successfully unassigned.",
        student: result.rows[0],
      });
    } catch (error) {
      console.error("Remove student error:", error);

      res.status(500).json({
        message: "Failed to remove student.",
      });
    }
  }
);

// START SERVER — KEEP THIS AT THE BOTTOM
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// GET A TEACHER'S SECTION
app.get("/api/teachers/:id/section", async (req, res) => {
  try {
    const teacherId = Number(req.params.id);

    const result = await pool.query(
      `SELECT section
       FROM users
       WHERE user_id = $1 AND role = 'Teacher'`,
      [teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    res.json({
      section: result.rows[0].section || "",
    });
  } catch (error) {
    console.error("Get teacher section error:", error);
    res.status(500).json({
      message: "Failed to load teacher section.",
    });
  }
});

// SAVE OR UPDATE A TEACHER'S SECTION
app.put("/api/teachers/:id/section", async (req, res) => {
  const teacherId = Number(req.params.id);
  const section = req.body.section?.trim();

  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return res.status(400).json({
      message: "Invalid teacher ID.",
    });
  }

  if (!section || section.length > 100) {
    return res.status(400).json({
      message: "Section is required and must be 100 characters or fewer.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const teacherResult = await client.query(
      `UPDATE users
       SET section = $1
       WHERE user_id = $2 AND role = 'Teacher'
       RETURNING user_id`,
      [section, teacherId]
    );

    if (teacherResult.rowCount === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Teacher not found.",
      });
    }

    // Update all students assigned to this teacher.
    await client.query(
      `UPDATE users
       SET section = $1
       WHERE teacher_id = $2 AND role = 'Student'`,
      [section, teacherId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Section updated successfully.",
      section,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update teacher section error:", error);

    res.status(500).json({
      message: "Failed to update section.",
    });
  } finally {
    client.release();
  }
});

app.listen()