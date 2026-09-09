const express = require('express');
const cors = require('cors');
const pool = require('./db/pool');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


// Get all users (for debugging)
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
    // Query using the 'user' column
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