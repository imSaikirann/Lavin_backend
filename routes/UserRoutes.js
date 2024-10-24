const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();


router.get('/getUsers', async (req, res) => {
    try {
        const data = await prisma.user.findMany({})
        res.status(200).json({
            success: true,
            message: "Users fetched Successfully",
            data: data,
        });
    } catch (error) {


        res.status(500).json({ message: 'Error getting users' });

    }
})

module.exports = router