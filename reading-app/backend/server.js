const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./db/pool');

const app = express();
const PORT = process.env.PORT || 5000;

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

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});