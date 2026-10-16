
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
       SET teacher_id = $1
       WHERE user_id = $2
         AND role = $3
       RETURNING user_id, teacher_id`,
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
  const { difficulty } = req.body;

  try {
    const allowedDifficulties = ["Easy", "Medium", "Hard"];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: "Please select Easy, Medium, or Hard.",
      });
    }

    const prompt = `
Create a short English reading passage for a high school student improving their reading ability.

Difficulty: ${difficulty}

Rules:
- Write one passage of around 80 to 120 words.
- Do not include a title, questions, answers, or explanations.
- Make it suitable for reading aloud.
- Easy: simple vocabulary and short sentences.
- Medium: moderately longer sentences and varied vocabulary.
- Hard: longer sentences and more advanced vocabulary, but still understandable.
- Return only the passage.
`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      reasoning_effort: "low",
      max_completion_tokens: 1000,
      temperature: 0.7,
    });

    const paragraph = (
      typeof response.choices?.[0]?.message?.content === "string"
        ? response.choices[0].message.content
        : ""
    ).trim();

    if (!paragraph) {
      return res.status(500).json({
        error: "The AI returned an empty passage. Please try again.",
      });
    }

    res.json({
      success: true,
      difficulty,
      paragraph,
    });
  } catch (error) {
    console.error("Groq error:", error);

    res.status(500).json({
      error: error.message || "Failed to generate reading passage.",
    });
  }
});

// START SERVER — KEEP THIS AT THE BOTTOM
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
