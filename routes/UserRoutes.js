const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const authenticateUser = require('../middleware/userMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, address, city, state, country, pincode } = req.body;

  const user = await prisma.user.create({
    data: {
      email,
      password, // Remember to hash the password in production!
      firstName,
      lastName,
      phoneNumber,
      address,
      city,
      state,
      country,
      pincode,
    },
  });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(201).json({ token });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ token });
});


router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: {email:req.user.email } });
    res.status(200).json(user);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Error getting user profile' });
  }
});

module.exports = router;
