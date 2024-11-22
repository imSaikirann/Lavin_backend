const express = require('express');
const router = express.Router();


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /events - Create a new event
router.post('/events', async (req, res) => {
    console.log(req.body)
    const { saleName, description, isSale } = req.body;
    
    try {
      const event = await prisma.events.create({
        data: {
          saleName:saleName,
          description:description,
          isSale:isSale,
        },
      });
  
      res.status(201).json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while creating the event." });
    }
  });
// GET /events - Get all events
router.get('/events', async (req, res) => {
    try {
      const events = await prisma.events.findMany();
      res.status(200).json(events);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching events." });
    }
  });
// GET /events/:id - Get an event by ID
router.get('/events/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const event = await prisma.events.findUnique({
        where: { id },
      });
  
      if (!event) {
        return res.status(404).json({ error: "Event not found." });
      }
  
      res.status(200).json(event);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while fetching the event." });
    }
  });
// PUT /events/:id - Update an event
router.put('/events/:id', async (req, res) => {
    const { id } = req.params;
    const { saleName, description, isSale } = req.body;
  
    try {
      const updatedEvent = await prisma.events.update({
        where: { id },
        data: {
          saleName,
          description,
          isSale,
        },
      });
  
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while updating the event." });
    }
  });
// DELETE /events/:id - Delete an event
router.delete('/events/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedEvent = await prisma.events.delete({
        where: { id },
      });
  
      res.status(200).json(deletedEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "An error occurred while deleting the event." });
    }
  });
          

module.exports = router
