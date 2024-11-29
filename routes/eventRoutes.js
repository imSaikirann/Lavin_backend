const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { uploadToS3, deleteFileFromS3 } = require('../services/s3Services');

// POST /events - Create a new event with image
router.post('/events', upload.single('image'), async (req, res) => {
    const { saleName, description, isSale } = req.body;

    try {
        let imageUrl = null;

        if (req.file) {
            const s3Response = await uploadToS3(req.file);
            imageUrl = s3Response.Location;
        }

        const event = await prisma.events.create({
            data: {
                saleName,
                description,
                isSale: isSale === 'true',
                imageUrl,
            },
        });

        res.status(201).json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the event.' });
    }
});

// DELETE /events/:id - Delete an event along with the image
router.delete('/events/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const event = await prisma.events.findUnique({ where: { id: parseInt(id, 10) } });

        if (!event) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        if (event.imageUrl) {
            await deleteFileFromS3(process.env.S3_BUCKET_NAME, event.imageUrl);
        }

        const deletedEvent = await prisma.events.delete({ where: { id: parseInt(id, 10) } });

        res.status(200).json(deletedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the event.' });
    }
});

// GET /events - Retrieve all events
router.get('/events', async (req, res) => {
    try {
        const events = await prisma.events.findMany();

        res.status(200).json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving the events.' });
    }
});

module.exports = router;
