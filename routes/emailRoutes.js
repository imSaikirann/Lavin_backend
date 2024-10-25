const express = require('express');
const router = express.Router();
const { sendEmail, verifyEmail } = require('../services/emailServices');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Send OTP
router.post('/auth/send-otp', async (req, res) => {
    const { email } = req.body;

    try {
        const response = await sendEmail(email);
        res.status(200).json({ response });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Error sending OTP' });
    }
});

// Verify OTP

router.post('/auth/verify-otp', async (req, res) => {
    const { email, code, firstName, lastName, phoneNumber, address, street, city, state, country, pincode } = req.body;

    console.log("Received data for OTP verification:", req.body); // Add this line for logging

    try {
        const response = await verifyEmail(email, code);

        if (response.verified) {
            const existedUser = await prisma.user.findFirst({ where: { email } });

            if (existedUser) {
                await prisma.oTP.deleteMany({
                    where: { email },
                });
                
                const userWithOrders = await prisma.user.findUnique({
                    where: { email },
                    include: {
                        orders: true, 
                    },
                });
                
                return res.status(200).json({ message: 'User already exists', data: userWithOrders });
            }

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

            await prisma.oTP.deleteMany({
                where: { email },
            });
            await prisma.userEmailVerification.delete({
                where: { email },
            });

            return res.status(201).json({ message: 'User created successfully', user });
        } else {
            console.error("OTP verification failed:", response.message); 
            return res.status(400).json({ message: response.message });
        }
    } catch (error) {
        console.error('Error verifying OTP and creating user:', error);
        return res.status(500).json({ message: 'Error verifying OTP and creating user' });
    }
});


module.exports = router;