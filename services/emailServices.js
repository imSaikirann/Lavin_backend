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

const generateOTP = () => crypto.randomInt(100000, 999999).toString()

const sendEmail = async (email) => {
    let user = await prisma.userEmailVerification.findUnique({
        where: { email }
    })

    if (!user) {
        user = await prisma.userEmailVerification.create({
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
            email:email,
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
  
    const user = await prisma.userEmailVerification.findUnique({
        where: {
            email: email  
          },
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

    console.log(latestOTP)
    if (latestOTP.code.toString() === otp && latestOTP.expiresAt > new Date()) {
    
     
        return { message: 'Email verified successfully', verified: true};

         
      } else if (latestOTP.expiresAt <= new Date()) {
        return { message: 'OTP expired', verified: false };
      } else {
        return { message: 'Invalid OTP', verified: false };
      }
}

module.exports = { sendEmail,verifyEmail }