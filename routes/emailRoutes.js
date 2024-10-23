const express = require('express');
const router = express.Router();
const { sendEmail ,verifyEmail} = require('../services/emailServices'); 


router.post('/auth/send-otp', async (req, res) => {
    const { email } = req.body;
  
    try {
      const response = await sendEmail(email);
      res.status(200).json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error sending OTP' });
    }
  });


router.post('/auth/verifyOTP', async (req, res) => {
    const { email,code } = req.body;
  
    try {
      const response = await verifyEmail(email,code);
      if (response.verified) {
        res.status(200).json(response);
      } else {
        res.status(400).json(response);
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error verifying OTP' });
    }
  });


module.exports = router