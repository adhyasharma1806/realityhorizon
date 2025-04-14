// server.js - Express backend for Realty Horizon
const User = require('./User');





const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;
mongoose.connect('mongodb+srv://adhya2006:Meresairam2006@adhya.okqfiqs.mongodb.net//realtyhorizon?retryWrites=true&w=majority&appName=adhya', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('✅ Connected to MongoDB Atlas');
  }).catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Secret key for JWT
const JWT_SECRET = 'realty_horizon_jwt_secret_key';

// In-memory database (replace with MongoDB/MySQL in production)
const users = [];
const properties = [
  {
    id: '1',
    title: 'Modern Beachfront Villa',
    arModel: '/models/villa.glb',
    price: '$2,710,000',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 3500,
    city: 'Miami',
    type: 'Villa',
    priceRange: '$2M - $3M',
    arModel: '/models/beachfront-villa.glb'
  },
  {
    id: '2',
    title: 'Luxury Downtown Penthouse',
    price: '$1,185,000',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2800,
    city: 'New York',
    type: 'Penthouse',
    priceRange: '$1M - $2M',
    arModel: '/models/downtown-penthouse.glb'
  },
  {
    id: '3',
    title: 'Urban Townhouse',
    price: '$1,200,000',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 2400,
    city: 'Chicago',
    type: 'Townhouse',
    priceRange: '$1M - $2M',
    arModel: '/models/urban-townhouse.glb'
  },
  {
    id: '4',
    title: 'Suburban Family Home',
    price: '$750,000',
    bedrooms: 4,
    bathrooms: 3,
    sqft: 2800,
    city: 'Seattle',
    type: 'House',
    priceRange: '$500K - $1M',
    arModel: '/models/suburban-home.glb'
  },
  {
    id: '5',
    title: 'Waterfront Condo',
    price: '$550,000',
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1500,
    city: 'San Francisco',
    type: 'Condo',
    priceRange: '$500K - $1M',
    arModel: '/models/waterfront-condo.glb'
  }
];

// Filter data
const filters = {
  cities: ['Miami', 'New York', 'Chicago', 'Seattle', 'San Francisco', 'All Cities'],
  propertyTypes: ['Villa', 'Penthouse', 'Townhouse', 'House', 'Condo', 'All Types'],
  priceRanges: ['Under $500K', '$500K - $1M', '$1M - $2M', '$2M - $3M', 'Over $3M', 'All Prices']
};

// Routes
// Get filter options
app.get('/api/filters', (req, res) => {
  res.json(filters);
});

// Search properties
app.get('/api/search', (req, res) => {
  const { city, type, priceRange } = req.query;
  let results = [...properties];
  
  if (city && city !== 'All Cities') {
    results = results.filter(p => p.city === city);
  }
  
  if (type && type !== 'All Types') {
    results = results.filter(p => p.type === type);
  }
  
  if (priceRange && priceRange !== 'All Prices') {
    results = results.filter(p => p.priceRange === priceRange);
  }
  
  res.json(results);
});

// Get AR model for a property
app.get('/api/property/:id/ar', (req, res) => {
  const property = properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  res.json({ arModel: property.arModel });
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      email,
      password: hashedPassword
    };
    
    users.push(newUser);
    
    // Generate JWT token
    const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Protected route example
app.get('/api/user/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email
  });
});
// Simulated user saved and AR data (replace with DB in future)
const savedPropertiesMap = {
  'user-id-1': ['1', '3'],
  'user-id-2': ['2']
};

const arTourHistoryMap = {
  'user-id-1': ['1', '2'],
  'user-id-2': ['3']
};

// Get saved properties
app.get('/api/user/saved', authenticateToken, (req, res) => {
  const ids = savedPropertiesMap[req.user.id] || [];
  const results = properties.filter(p => ids.includes(p.id));
  res.json(results);
});

// Get AR tour history
app.get('/api/user/ar-tours', authenticateToken, (req, res) => {
  const ids = arTourHistoryMap[req.user.id] || [];
  const results = properties.filter(p => ids.includes(p.id));
  res.json(results);
});


// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


