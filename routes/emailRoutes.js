const express = require('express');
const router = express.Router();
const { sendEmail, verifyEmail } = require('../services/emailServices');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateToken, generateRefreshToken } = require('../services/tokenServices');

// Send OTP
router.post('/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        const response = await sendEmail(email);
        res.status(200).json({ response });
    } catch (error) {
        console.error('Error sending OTP:', error.message);
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
});


router.post('/auth/verify-otp', async (req, res) => {
    const { email, code, firstName, lastName, phoneNumber, address, street, city, state, country, pincode } = req.body;
    console.log(req.body)
    try {
        const response = await verifyEmail(email, code);
        if (response.verified) {
            let user = await prisma.user.findUnique({ where: { email } });
            
            if (user) {
                await prisma.oTP.deleteMany({ where: { email } });
                const accessToken = generateToken(user);
            const refreshToken = generateRefreshToken(user);
                return res.status(200).json({ message: 'User already exists', user,accessToken,refreshToken });
            }
            else
            {
                const user = await prisma.user.create({
                    data: {
                        email,
                        firstName,
                        lastName,
                        phoneNumber,
                        address,
                        street,
                        city,
                        state,
                        country,
                        pincode,
                        isVerified: true,
                        isTemporary: true,
                    },
                });
                
                await prisma.oTP.deleteMany({ where: { email } });
                await prisma.userEmailVerification.delete({ where: { email } });
    
                const accessToken = generateToken(user);
                const refreshToken = generateRefreshToken(user);
                res.status(201).json({ message: 'User created successfully', user , accessToken, refreshToken });
            }
            
           
        } else {
            res.status(400).json({ message: response.message });
        }
    } catch (error) {
        console.error('Error verifying OTP and creating user:', error.message);
        res.status(500).json({ message: 'Error verifying OTP and creating user', error: error.message });
    }
});

module.exports = router;
