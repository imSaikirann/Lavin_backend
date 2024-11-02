const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateUser = require('../middleware/userMiddleware');

const prisma = new PrismaClient();
const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phoneNumber, address, city, state, country, pincode } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
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
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  res.status(200).json({ token });
});

// Set Password
router.post('/set-password', authenticateUser, async (req, res) => {
  const { newPassword } = req.body;

  try {
    // Retrieve the user
    const user = await prisma.user.findUnique({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the password already exists
    if (user.password) {
      return res.status(400).json({ message: 'Password is already set' });
    }

    // Hash the new password and update the user record
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword,
        isTemporary:false
       },
      
    });

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error setting password' });
  }
});


// Profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
      include: {
        orders: {
          include: {
            orderItems: true, // Include order items for each order
          },
        },
      },
    });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting user profile' });
  }
});


module.exports = router;
