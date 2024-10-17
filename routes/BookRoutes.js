const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const { uploadToS3 } = require('../services/s3Services');
const multer = require('multer');
const z = require('zod')

const upload = multer({ storage: multer.memoryStorage() });

const productSchema = z.object({
    productName: z.string().min(1, "Product name is required."),
    price: z.string().refine((val) => !isNaN(parseFloat(val)), {
        message: "Price must be a valid number.",
    }).transform(parseFloat),
    productDescription: z.string().min(1, "Product description is required."),
    offeredPrice: z.string().optional().refine((val) => !isNaN(parseFloat(val)), {
        message: "Offered price must be a valid number if provided.",
    }).transform((val) => (val ? parseFloat(val) : null)),
    categoryId: z.string().min(1, "Category ID is required."),
    categoryName: z.string().min(1, "Category name is required."),
});

router.post('/addProduct', upload.array('files'), async (req, res) => {
    const parsedData = productSchema.parse(req.body);
    const { productName, price, productDescription, offeredPrice, categoryId,categoryName } = parsedData;
    const parsedPrice = parseFloat(price);
    const parsedOfferedPrice = offeredPrice ? parseFloat(offeredPrice) : null;

    try {
        let imageUrl = [];

  
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToS3(file);
                imageUrl.push(result.Location);
            }
        }
    
        const pictureNames = imageUrl.map(url => {
            const parts = url.split('/');
            return parts[parts.length - 1];
        });

        const data = await prisma.product.create({
            data: {
                productName,
                price: parsedPrice,
                productDescription,
                offeredPrice: parsedOfferedPrice,
                categoryId,
                images: pictureNames,
                categoryName
            }
           
        });

        res.status(201).json({
            success: true,
            message: "Product added successfully",
            data
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


router.get('/getProducts', async (req, res) => {
    try {
        const data = await prisma.product.findMany({
            include: {
                internalPages:true,
                variants: true,
                reviews: true

            }
        });

        res.status(200).json({
            success: true,
            message: "Products fetched Successfully",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while getting products",
            error: error.message,
        });
    }
});


router.get('/getProduct/:id' , async (req, res) => {
   const {id} = req.params
    try {
      
        const data = await prisma.product.findFirst({
            where:{
                id : id
            },
            include:{
                variants:true,
                reviews:true
            }
        })

      
        res.status(200).json({
            success: true,
            message: "Product fetched Successfully",
            data: data,
        });
    } catch (error) {
      
        res.status(500).json({
            success: false,
            message: "An error occurred while getting product",
            error: error.message,
        });
    }
});


router.post('/addVariants/:id', async (req, res) => {
    const { id } = req.params; 
    const { size, productId, price, stock, color } = req.body;
    
    try {
        const data = await prisma.variant.create({
            data: { 
                size,
                price,
                stock,
                color,
                productId: id 
            }
        });

        res.status(201).json({
            success: true,
            message: "Variants added successfully",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while adding variants",
            error: error.message,
        });
    }
});

router.post('/addReview/:id', async (req, res) => {
    const { id } = req.params; 
    const {  comment,rating, productId  } = req.body;
    
    try {
        const data = await prisma.review.create({
            data: { 
                rating,
                comment,
                productId: id 
            }
        });

        res.status(201).json({
            success: true,
            message: "Review added successfully",
            data: data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while adding Review",
            error: error.message,
        });
    }
});

router.post('/addInternalPages/:id',  upload.array('files'), async (req, res) => {
    const { id } = req.params; 
    const {  pageType  ,pageCount } = req.body;
    
    try {
        let imageUrl = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await uploadToS3(file);
                imageUrl.push(result.Location);
            }
        }
    
        const pictureNames = imageUrl.map(url => {
            const parts = url.split('/');
            return parts[parts.length - 1];
        });

        const data = await prisma.internalPage.create({
            data: {
                pageType ,
                pageCount,
                images: pictureNames,
                productId:id
            }
           
        });

        res.status(201).json({
            success: true,
            message: "Book internal pages  added successfully",
            data
        });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while adding the book pages",
            error: error.message,
        });
    }
});



module.exports = router;
