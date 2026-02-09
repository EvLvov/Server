const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BlacklistedToken = require('../models/BlacklistedToken');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const { buildAvatar } = require('../utils/avatar');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const candidate = await User.findOne({ email });
    if (candidate) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );


    res.status(201).json({ token });
  } catch (e) {
    res.status(500).json({ message: 'Register error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
    {
    userId: user._id,
    role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
 );


    res.json({ token });
  } catch (e) {
    res.status(500).json({ message: 'Login error' });
  }
});

// logout
router.post('/logout', auth, async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.decode(token);

  await BlacklistedToken.create({
    token,
    expiresAt: new Date(decoded.exp * 1000),
  });

  res.json({ message: 'Logged out' });
});

// me
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.userId).select('-password');
  res.json({
    ...user.toObject(),
    avatar: buildAvatar(user.avatar),
  });
});

// admin
router.get('/admin', auth, role(['admin']), (req, res) => {
  res.json({ message: 'Welcome admin' });
});

// назначить админа
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'You admin',
      user,
    });
  } catch (e) {
    res.status(500).json({ message: 'Error making admin' });
  }
});



module.exports = router;
