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

    console.log(req.body); // This will log the incoming request data

    try {
        // Ensure that 'weight' is converted to a float if it's provided
        const data = await prisma.productSpecification.create({
            data: { 
                productId: id, 
                weight: weight ? parseFloat(weight) : null, // Convert weight to float
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
        console.error("Error creating product specification:", error); // For better debugging
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the product specification",
            error: error.message,
        });
    }
});

router.get('/getProductSpecification/:id', async (req, res) => {
    const { id } = req.params;  

    try {
        // Fetch the product specification from the database by its unique ID
        const specification = await prisma.productSpecification.findUnique({
            where: { id: id }, // Make sure the ID is in the correct format (integer)
        });

        if (!specification) {
            return res.status(404).json({
                success: false,
                message: "Product specification not found.",
            });
        }

        // Send the product specification data as the response
        res.status(200).json({
            success: true,
            data: specification,
        });
    } catch (error) {
        console.error("Error fetching product specification:", error);  // For debugging
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching the product specification",
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
        // Check if the product specification exists
        const existingSpec = await prisma.productSpecification.findUnique({
            where: { id }, // Using 'id' for the specification unique ID
        });

        if (!existingSpec) {
            return res.status(404).json({
                success: false,
                message: "Product specification not found.",
            });
        }

        // Update the specification with the new data
        const updatedSpec = await prisma.productSpecification.update({
            where: { id },  // Ensure you're using the correct field, 'id' for the specification
            data: { 
                weight: weight ? parseFloat(weight) : null, // Handle weight conversion to float
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
        console.error("Error updating product specification:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while updating the product specification",
            error: error.message,
        });
    }
});

// DELETE route for deleting a product specification
router.delete('/deleteProductSpecification/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Check if the specification exists
        const existingSpec = await prisma.productSpecification.findUnique({
            where: { id }, // Assuming 'id' refers to the specification unique ID
        });

        if (!existingSpec) {
            return res.status(404).json({
                success: false,
                message: "Product specification not found.",
            });
        }

        // Delete the product specification
        await prisma.productSpecification.delete({
            where: { id },
        });

        res.status(200).json({
            success: true,
            message: "Product specification deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting product specification:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the product specification",
            error: error.message,
        });
    }
});

module.exports = router;
