const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

const {generateToken,generateRefreshToken} = require('../services/tokenServices')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
    },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString()

const sendEmail = async (email) => {
    let user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        user = await prisma.user.create({
            data: {
                email,
            },
        });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.oTP.create({
        data: {
            code: otp,
            userId: user.id,
            expiresAt,
        },
    });

    // Send the OTP via email
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP Code for Verification',
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    };
    await transporter.sendMail(mailOptions);
    return { message: 'OTP sent successfully' };
}


const verifyEmail = async (email, otp) => {
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            otps: true
        }
    })

    if (!user) {
        return { message: "User not Found", verified: false }
    }

    const latestOTP = user.otps[user.otps.length - 1]

    if (!latestOTP) {
        return { message: 'OTP not found', verified: false };
    }


    if (latestOTP.code === otp && latestOTP.expiresAt > new Date()) {
        // Mark the user as verified
        await prisma.user.update({
          where: { email },
          data: { isVerified: true },
        });

        const accessToken = generateToken(user)

        const refreshToken = generateRefreshToken(user)
        return { message: 'Email verified successfully', verified: true,
            accessToken,
            refreshToken
         };

         
      } else if (latestOTP.expiresAt <= new Date()) {
        return { message: 'OTP expired', verified: false };
      } else {
        return { message: 'Invalid OTP', verified: false };
      }
}

module.exports = { sendEmail,verifyEmail }