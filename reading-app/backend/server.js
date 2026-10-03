const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
require('dotenv').config();
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

app.use(cors());
app.use(express.json());


app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// LOGIN ENDPOINT - FIXED FOR YOUR TABLE
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
    

    if (userData.password !== password) {
      return res.status(401).json({ error: 'Wrong password' });
    }

     if (role && userData.role !== role) {
      return res.status(403).json({ 
        error: 'Role mismatch'
      });
    }
    
   
    
    // Return user data (no token for now)
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

app.listen(PORT, () => {
});

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

app.post('/api/register', async (req, res) => {
  try {
    const { user, full_name, password, role } = req.body;

    // 1. Validate required fields
    if (!user || !full_name || !password || !role) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // 2. Check if username already exists
    const existingUser = users.find((u) => u.user.toLowerCase() === user.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // 3. Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4. Save new user object
    const newUser = {
      id: users.length + 1,
      user,
      full_name,
      password: hashedPassword,
      role,
      createdAt: new Date(),
    };

    users.push(newUser);

    console.log("Registered Users:", users); // Logged to terminal for verification

    // 5. Send success response
    return res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: newUser.id,
        user: newUser.user,
        full_name: newUser.full_name,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});


