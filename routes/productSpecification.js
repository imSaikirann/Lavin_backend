const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();

// POST route for adding a new product specification
router.post('/addProductSpecification/:id', async (req, res) => {
    const { id } = req.params;
    const { 
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
                productId: id, 
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

// PUT route for updating an existing product specification
router.put('/editProductSpecification/:id', async (req, res) => {
    const { id } = req.params;
    const { 
        weight, 
        dimensions, 
        material, 
        color, 
        brand, 
        manufacturer, 
        warrantyPeriod 
    } = req.body;

    try {
        // Check if specification exists for the given productId
        const existingSpec = await prisma.productSpecification.findUnique({
            where: {
                productId: id,
            },
        });

        if (!existingSpec) {
            return res.status(404).json({
                success: false,
                message: "Product specification not found.",
            });
        }

        // Update the existing specification
        const updatedSpec = await prisma.productSpecification.update({
            where: {
                productId: id, // or use the unique id of the specification if necessary
            },
            data: { 
                weight,
                dimensions,
                material,
                color,
                brand,
                manufacturer,
                warrantyPeriod
            }
        });

        res.status(200).json({
            success: true,
            message: "Product specification updated successfully",
            data: updatedSpec,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the product specification",
            error: error.message,
        });
    }
});

module.exports = router;
