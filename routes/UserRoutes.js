const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateUser = require('../middleware/userMiddleware');
const {sendEmail,verifyEmail} = require('../services/emailServices')
const prisma = new PrismaClient();
const router = express.Router();

// Registration
router.post('/register', async (req, res) => {
  const { email } = req.body;

  try {

    const response = await sendEmail(email);

  
    res.status(201).json(response);
  } catch (error) {

    console.error('Error during registration:', error);

  
    res.status(500).json({ message: 'An error occurred during registration. Please try again later.' });
  }
});


// Email Verification and Account Creation
router.post('/verify-new_email', async (req, res) => {
  
  const { email, otp, password, firstName, lastName, phone, address, city, state, country, pincode } = req.body;

  try {
    // Step 1: Verify the email using the OTP
    const response = await verifyEmail(email, otp);

    if (!response.verified) {
      // If OTP verification fails, send an appropriate response
      return res.status(400).json({ message: response.message || 'OTP verification failed' });
    }

    // Step 2: Check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Account already exists for this email.' });
    }

    // Step 3: Hash the password and create a new user account
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phone,
        address,
        city,
        state,
        country,
        pincode,
        isVerified: true, 
        isTemporary:false,
      },
    });

    // Step 4: Generate a JWT token for the new user
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Step 5: Respond with success
    return res.status(201).json({ message: 'Account created successfully', token });
  } catch (error) {
    // Log the error and send a user-friendly message
    console.error('Error verifying email and creating account:', error);
    res.status(500).json({ message: 'An internal server error occurred. Please try again later.' });
  }
});

router.post('/verify_otp',async (req,res)=>{
  const { email, otp,  } = req.body;

  try {
    const response = await verifyEmail(email, otp);
    console.log(response)
    if (!response.verified) {
  
      return res.status(400).json({ message: response.message || 'OTP verification failed' });
    }

    res.status(200).json({message:"Verifyied"})

  } catch (error) {
    res.status(500).json({ message: 'Error verifying email' });
  }
})


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

router.post('/forgot_password',  async (req, res) => {
  const {email, newPassword } = req.body;

  try {
    // Retrieve the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

  

    // Hash the new password and update the user record
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword
       },
      
    });

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error setting password' });
  }
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
  console.log("profile",req.user)
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        orders: {
          include: {
            orderItems: true, 
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

router.get('/getUsersData',async (req,res)=>{
  try {
    const data = await prisma.user.findMany({})
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error getting uses data' });
  }
})

module.exports = router;
