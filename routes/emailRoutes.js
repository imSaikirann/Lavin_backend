const express = require('express');
const router = express.Router();
const { sendEmail, verifyEmail } = require('../services/emailServices');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateToken } = require('../services/tokenServices');
const CreateCartUser = require('../routes/cartRoutes');

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
    const { email, code, firstName, lastName, phone, address, street, city, state, country, pinCode } = req.body;

    try {
        // Verify the OTP
        const response = await verifyEmail(email, code);
        if (!response.verified) {
            return res.status(400).json({ message: response.message });
        }

        // Check if the user already exists
        let user = await prisma.user.findUnique({
            where: { email },
            include: { orders: true }
        });

        if (!user) {
            // Create the user if not found
            user = await prisma.user.create({
                data: {
                    email,
                    firstName,
                    lastName,
                    phoneNumber:phone,
                    address,
                    street,
                    city,
                    state,
                    country,
                    pincode:pinCode,
                    isVerified: true,
                    isTemporary: true,
                },
            });
        }

        // Clean up OTP and verification records
        await prisma.oTP.deleteMany({ where: { email } });
        await prisma.userEmailVerification.delete({ where: { email } });

        // Generate the access token
        const accessToken = generateToken(user.id);

        // Respond with user details and access token
        res.status(201).json({
            message: user ? 'User already exists' : 'User created successfully',
            user,
            accessToken
        });
    } catch (error) {
        console.error('Error verifying OTP and creating user:', error.message);
        res.status(500).json({ message: 'Error verifying OTP and creating user', error: error.message });
    }
});



module.exports = router;
