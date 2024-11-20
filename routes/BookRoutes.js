const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const { uploadToS3, deleteFileFromS3 } = require('../services/s3Services');
const multer = require('multer');
const z = require('zod');

const upload = multer({ storage: multer.memoryStorage() });

const productSchema = z.object({
    productName: z.string(),
    price: z.number(), // Change to expect a number (float)
    productDescription: z.string(),
    offeredPrice: z.number().optional(), // offeredPrice is optional, so use optional()
    categoryName: z.string(),
  });
  

// Add Product
router.post('/addProduct', async (req, res) => {
    console.log(req.body)
    try {
        const parsedData = productSchema.parse(req.body);
        const { productName, price, productDescription, offeredPrice, categoryName } = parsedData;

        const data = await prisma.product.create({
            data: {
                productName,
                price,
                productDescription,
                offeredPrice,
                categoryName,
            },
        });

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data,
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the product",
            error: error.message,
        });
    }
});

// Get All Products
router.get('/getProducts', async (req, res) => {
    try {
        const data = await prisma.product.findMany({
            include: {
                variants: true,
                reviews: true,
                specifications: true,
                internalPages:true
            },
        });

        res.status(200).json({
            success: true,
            message: "Products fetched successfully",
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while getting products",
            error: error.message,
        });
    }
});

// Edit Product
router.put('/editProduct/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const parsedData = productSchema.parse(req.body);
        const { productName, price, productDescription, offeredPrice, categoryName } = parsedData;

        const data = await prisma.product.update({
            where: { id },
            data: {
                productName,
                price,
                productDescription,
                offeredPrice,
                categoryName,
            },
        });

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while editing the product",
            error: error.message,
        });
    }
});

// Delete Product
router.delete('/deleteProduct/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.product.delete({ where: { id } });

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the product",
            error: error.message,
        });
    }
});

// Get Single Product
router.get('/getProduct/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const data = await prisma.product.findFirst({
            where: { id },
            include: {
                variants: true,
                reviews: true,
            },
        });

        res.status(200).json({
            success: true,
            message: "Product fetched successfully",
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while getting the product",
            error: error.message,
        });
    }
});

router.post('/addVariant/:productId', upload.array('files'), async (req, res) => {
    const { productId } = req.params;
    const { size, stock, color } = req.body;

    try {
        let imageUrl = [];

        // Handle file uploads to S3 and store the URLs in imageUrl array
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToS3(file);
                imageUrl.push(result.Location);
            }
        }

        // Create the variant and associate it with the product
        const data = await prisma.variant.create({
            data: {
                size,
                stock: parseInt(stock), // Ensure stock is parsed as a number
                color,
                images: imageUrl,
                product: { 
                    connect: { id: productId } // Use productId to connect to the existing product
                }
            }
        });

        // Send success response with created variant data
        res.status(201).json({
            success: true,
            message: "Variant added successfully",
            data,
        });
    } catch (error) {
        console.error("Error adding variant:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the variant",
            error: error.message,
        });
    }
});


// Edit Variant
router.put('/editVariant/:id', upload.array('files'), async (req, res) => {
    const { id } = req.params;
    const { size, stock, color } = req.body;

    try {
        let imageUrl = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToS3(file);
                imageUrl.push(result.Location);
            }
        }

        const data = await prisma.variant.update({
            where: { id },
            data: {
                size,
                stock: parseInt(stock),
                color,
                images: imageUrl.length > 0 ? imageUrl : undefined,
            },
        });

        res.status(200).json({
            success: true,
            message: "Variant updated successfully",
            data,
        });
    } catch (error) {
        console.error("Error editing variant:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while editing the variant",
            error: error.message,
        });
    }
});

// Delete Variant
router.delete('/deleteVariant/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await prisma.variant.delete({ where: { id } });

        res.status(200).json({
            success: true,
            message: "Variant deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the variant",
            error: error.message,
        });
    }
});

// Add InternalPage
router.post('/addInternalPage/:id', upload.array('images'), async (req, res) => {
    const {id} = req.params
    try {
        const { pageType, pageCount } = req.body;
        let imagesUrl = [];

      
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToS3(file); 
                imagesUrl.push(result.Location);
            }
        }

        // Create new InternalPage
        const internalPage = await prisma.internalPage.create({
            data: {
                pageType,
                pageCount,
                images: imagesUrl, 
                productId:id
            },
        });

        res.status(201).json({
            success: true,
            message: 'Internal Page added successfully',
            data: internalPage
        });
    } catch (error) {
        console.error('Error adding internal page:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while adding the internal page',
            error: error.message
        });
    }
});

// Get All InternalPages
router.get('/getInternalPages', async (req, res) => {
    try {
        const data = await prisma.internalPage.findMany({
            include: {
                product: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Internal Pages fetched successfully',
            data
        });
    } catch (error) {
        console.error('Error fetching internal pages:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching internal pages',
            error: error.message
        });
    }
});

// Get Single InternalPage
router.get('/getInternalPage/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const data = await prisma.internalPage.findUnique({
            where: { id },
            include: {
                product: true 
            }
        });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: 'Internal Page not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Internal Page fetched successfully',
            data
        });
    } catch (error) {
        console.error('Error fetching internal page:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the internal page',
            error: error.message
        });
    }
});


router.put('/editInternalPage/:id', upload.array('images'), async (req, res) => {
    const { id } = req.params;
    const { pageType, pageCount, productId } = req.body;
    let imagesUrl = [];

    try {
       
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToS3(file); 
                imagesUrl.push(result.Location);
            }
        }

      
        const updatedInternalPage = await prisma.internalPage.update({
            where: { id },
            data: {
                pageType,
                pageCount,
                images: imagesUrl.length > 0 ? imagesUrl : undefined, 
                product: { connect: { id: productId } }
            },
        });

        res.status(200).json({
            success: true,
            message: 'Internal Page updated successfully',
            data: updatedInternalPage
        });
    } catch (error) {
        console.error('Error updating internal page:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the internal page',
            error: error.message
        });
    }
});

router.delete('/deleteInternalPage/:id', async (req, res) => {
    const { id } = req.params;

    try {
     
        const internalPage = await prisma.internalPage.findUnique({
            where: { id },
            select: {
                images: true,
            }
        });

        if (internalPage && internalPage.images && internalPage.images.length > 0) {
        
            for (const imageUrl of internalPage.images) {
                const imageKey = imageUrl.split('/').pop(); 
                await deleteFileFromS3(imageKey); 
            }
        }

        // Now delete the internal page from the database
        await prisma.internalPage.delete({
            where: { id }
        });

        res.status(200).json({
            success: true,
            message: 'Internal Page and associated images deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting internal page:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting the internal page',
            error: error.message
        });
    }
});


module.exports = router;
