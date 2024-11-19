const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();

const prisma = new PrismaClient();

// Middleware to track traffic
router.use(async (req, res, next) => {
  try {
    const userIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress; 
    const today = new Date().toISOString().split('T')[0]; 

 
    const trafficEntry = await prisma.traffic.findFirst({
      where: { ip: userIP, date: today },
    });

    if (!trafficEntry) {
    
      await prisma.traffic.create({
        data: { ip: userIP, date: today, visits: 1 },
      });
    } else {
   
      await prisma.traffic.update({
        where: { id: trafficEntry.id },
        data: { visits: trafficEntry.visits + 1 },
      });
    }

    next(); 
  } catch (error) {
    console.error('Error tracking traffic:', error);
    next(); 
  }
});

// Admin route to fetch traffic data
router.get('/admin/traffic', async (req, res) => {
  try {
    const trafficData = await prisma.traffic.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(trafficData);
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    res.status(500).json({ error: 'An error occurred while fetching traffic data' });
  }
});

module.exports = router;
