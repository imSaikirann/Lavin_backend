const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authenticateUser = require('../middleware/userMiddleware')
const prisma = new PrismaClient();

// Create a new review
router.post('/addReview/:id',  authenticateUser, async (req, res) => {
    const { id } = req.params; 
    const userId = req.user.id
    const { comment, rating } = req.body;  
    console.log("here",req.user)
    try {

        const userName = await prisma.user.findFirst({
            where: {
                id: userId
            },
            select: {
                firstName: true
            }
        });
        
        console.log(userName)
        const data = await prisma.review.create({
            data: { 
                userName:userName.firstName,
                rating:parseInt(rating),
                comment,
                productId: id,
            }
        });
        console.log(data)
        res.status(201).json({
            success: true,
            message: "Review added successfully",
            data: data,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "An error occurred while adding review",
            error: error.message,
        });
    }
});

router.post('/addReviews/:id',   async (req, res) => {
    
    const { id } = req.params; 
    const { comment, rating ,userName} = req.body;  

console.log(req.body)
    try {

      
       
        const data = await prisma.review.create({
            data: { 
                userName,
                rating:parseInt(rating),
                comment,
                productId: id,
            }
        });
      
        res.status(201).json({
            success: true,
            message: "Review added successfully",
            data: data,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "An error occurred while adding review",
            error: error.message,
        });
    }
});

// Read all reviews
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany();
        res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching reviews",
            error: error.message,
        });
    }
});

// Read reviews for a specific product
router.get('/reviews/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const reviews = await prisma.review.findMany({
            where: { productId },
        });

        res.status(200).json({
            success: true,
            data: reviews,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching reviews for the product",
            error: error.message,
        });
    }
});

// Update a review
router.put('/updateReview/:reviewId', async (req, res) => {
    const { reviewId } = req.params;
    const { comment, rating } = req.body;

    try {
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: { comment, rating },
        });

        res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: updatedReview,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the review",
            error: error.message,
        });
    }
});

// Delete a review
router.delete('/deleteReview/:reviewId', async (req, res) => {
    const { reviewId } = req.params;

    try {
        await prisma.review.delete({
            where: { id: reviewId },
        });

        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the review",
            error: error.message,
        });
    }
});

module.exports = router;
