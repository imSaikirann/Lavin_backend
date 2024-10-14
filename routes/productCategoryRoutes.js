const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();

router.post('/addProductCategory', async (req, res) => {
    const { category } = req.body; 
    try {
       
        const data = await prisma.productCategory.create({
            data: { 
                category 
            }
        });

        res.status(201).json({
            success: true,
            message: "Product category created successfully",
            data: data,
        });
    } catch (error) {
      
        res.status(500).json({
            success: false,
            message: "An error occurred while creating the category",
            error: error.message,
        });
    }
});

router.get('/getCategories', async (req, res) => {
   
    try {
      
        const data = await prisma.productCategory.findMany({})

        if(data == "")
        {
            res.status(200).json({
                success: true,
                message: "Product catgegories are Empty"
            });
        }
        res.status(200).json({
            success: true,
            message: "Product catgegories",
            data: data,
        });
    } catch (error) {
      
        res.status(500).json({
            success: false,
            message: "An error occurred while getting product cetgories",
            error: error.message,
        });
    }
});


module.exports = router;
