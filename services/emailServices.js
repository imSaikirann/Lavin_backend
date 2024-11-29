const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const transporter = nodemailer.createTransport({ 
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendEmail = async (email) => {
    let userVerification = await prisma.userEmailVerification.upsert({
        where: { email },
        create: { email },
        update: {}
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.oTP.create({
        data: { code: otp, userId: userVerification.id, email, expiresAt },
    });

    await transporter.sendMail({
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP Code for Verification',
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    return { message: 'OTP sent successfully' };
};

const verifyEmail = async (email, otp) => {
    console.log(otp)
    const user = await prisma.userEmailVerification.findUnique({
        where: { email },
        include: { otps: true },
    });

    if (!user || !user.otps.length) {
        return { message: 'User not found or OTP does not exist', verified: false };
    }

    const latestOTP = user.otps[user.otps.length - 1];
    console.log(latestOTP)
    if (latestOTP.code === otp && latestOTP.expiresAt > new Date()) {
        return { message: 'Email verified successfully', verified: true };
    } else if (latestOTP.expiresAt <= new Date()) {
        return { message: 'OTP expired', verified: false };
    } else {
        return { message: 'Invalid OTP', verified: false };
    }
};

module.exports = { sendEmail, verifyEmail };
