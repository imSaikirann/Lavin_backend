const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();

router.post('/create-order',  async (req, res) => {
    return res.json("Payment done")
})

module.exports = router