const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();

// Route to add product specification
router.post('/addProductSpecification', async (req, res) => {
    const { 
        productId, 
        weight, 
        dimensions, 
        material, 
        color, 
        brand, 
        manufacturer, 
        warrantyPeriod 
    } = req.body;

    try {
     
        const data = await prisma.productSpecification.create({
            data: { 
                productId,
                weight,
                dimensions,
                material,
                color,
                brand,
                manufacturer,
                warrantyPeriod
            }
        });

        res.status(201).json({
            success: true,
            message: "Product specification created successfully",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the product specification",
            error: error.message,
        });
    }
});


module.exports = router;
