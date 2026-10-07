const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const { GoogleGenAI } = require("@google/genai");

require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./db/pool');
const app = express();
const PORT = process.env.PORT || 5000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});


app.use(cors());
app.use(express.json());

// GET ALL USERS
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN ENDPOINT
app.post('/api/login', async (req, res) => {
  const { user, password, role } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE "user" = $1',
      [user]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = result.rows[0];

    // Password comparison (checks bcrypt hash, falls back to plain text for old records)
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, userData.password);
    } catch {
      isPasswordValid = (userData.password === password);
    }

    if (!isPasswordValid && userData.password !== password) {
      return res.status(401).json({ error: 'Wrong password' });
    }

    if (role && userData.role !== role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }

    res.json({
      success: true,
      user: {
        id: userData.user_id,
        username: userData.user,
        name: userData.full_name,
        role: userData.role
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REGISTER ENDPOINT
app.post('/api/register', async (req, res) => {
  try {
    const { user, full_name, password, role } = req.body;

    // 1. Validate required fields
    if (!user || !full_name || !password || !role) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 2. Check if username already exists in database
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE LOWER("user") = LOWER($1)',
      [user]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // 3. Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Insert new user into PostgreSQL
    const insertQuery = `
      INSERT INTO users ("user", full_name, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, "user", full_name, role;
    `;
    const newUserResult = await pool.query(insertQuery, [
      user,
      full_name,
      hashedPassword,
      role
    ]);

    const newUser = newUserResult.rows[0];

    // 5. Send success response
    return res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser.user_id,
        user: newUser.user,
        full_name: newUser.full_name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error." });
  }
});

// DELETE USER ENDPOINT
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GENERATE READING PASSAGE
app.post('/api/generate-reading', async (req, res) => {
  const { difficulty } = req.body;

  try {
    if (!difficulty) {
      return res.status(400).json({
        error: 'Difficulty is required.'
      });
    }

    const allowedDifficulties = ['Easy', 'Medium', 'Hard'];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty.'
      });
    }

    const prompt = `
Create a short English reading passage for a high school student who is improving their reading ability.

Difficulty: ${difficulty}

Rules:
- Create ONE reading passage only.
- Do not create questions.
- Do not create answers.
- Do not add explanations.
- Do not add a title.
- Make the passage suitable for reading aloud.
- Use clear and natural English.
- Make the passage around 80 to 120 words.

Difficulty rules:

Easy:
Use simple vocabulary and short sentences.

Medium:
Use moderately longer sentences and slightly more varied vocabulary.

Hard:
Use longer sentences and more advanced vocabulary while still being understandable for a high school student.

Return ONLY the reading passage.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt
    });

    const paragraph = response.text.trim();

    res.json({
      success: true,
      difficulty: difficulty,
      paragraph: paragraph
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      error: error.message || "Failed to generate reading passage."
    });
  }
});


// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
