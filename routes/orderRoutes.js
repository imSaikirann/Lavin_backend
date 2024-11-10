const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/userMiddleware'); 
const Razorpay = require('razorpay'); 
const razorpayInstance = new Razorpay({ 
    key_id: process.env.VITE_RAZORPAY_LIVE_ID, 
    key_secret: process.env.VITE_RAZORPAY_SECRET_KEY, 
});

router.get('/getAllOrders', async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                orderItems: true,
                user: true,
            },
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'An error occurred while fetching orders.' });
    }
});



const calculateTotalAmount = (items) => {
    return items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
};

router.post('/create-order', authenticateUser, async (req, res) => {
    const userId = req.user.userId;
    const { address, phone, items } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        let totalAmount = 0;

        for (const item of items) {
            if (!item.variant || !item.variant.id) {
                return res.status(400).json({
                    error: `Missing variant ID for product ${item.productId}. Please ensure all items have valid variants.`,
                });
            }

            // Fetch the variant to check stock and price
            const productVariant = await prisma.variant.findUnique({
                where: { id: item.variant.id },
            });

            if (!productVariant) {
                return res.status(404).json({ error: `Variant for product ID ${item.productId} not found.` });
            }

            if (productVariant.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for product ${item.productId}. Available stock: ${productVariant.stock}`,
                });
            }

            totalAmount += item.productPrice * item.quantity;
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: totalAmount * 100,
            currency: 'INR',
            receipt: `order_rcptid_${new Date().getTime()}`,
            payment_capture: 1,
        });

        const order = await prisma.order.create({
            data: {
                status: 'pending',
                address,
                phone,
                userId,
                payment: true,
                totalAmount,
                razorpayOrderId: razorpayOrder.id,
                orderItems: {
                    create: items.map((item) => ({
                        productId: item.productId,
                        variant: item.variant,
                        quantity: item.quantity,
                        productPrice: item.productPrice,
                        variantImage: item.variantImage,
                    })),
                },
            },
            include: { orderItems: true },
        });

        for (const item of items) {
            await prisma.variant.update({
                where: { id: item.variant.id },
                data: { stock: { decrement: item.quantity } },
            });
        }

        res.status(201).json({
            order: order,
            razorpayOrderId: razorpayOrder.id,
            razorpayPaymentLink: razorpayOrder.payment_link,
        });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'An error occurred while creating Razorpay order.' });
    }
});




router.post('/placeOrder', authenticateUser, async (req, res) => {
    const userId = req.user.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
       
        const cart = await prisma.cart.findFirst({
            where: { userId: userId },
            include: { items: true },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty. Please add items to your cart before placing an order.' });
        }

      
        let totalAmount = 0;


        for (const item of cart.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { variants: true },
            });

            if (!product) {
                return res.status(404).json({ error: `Product with ID ${item.productId} not found.` });
            }


            const variant = product.variants.find((v) => v.id === item.variant?.id);

            if (!variant) {
                return res.status(404).json({ error: `Variant for product ID ${item.productId} not found.` });
            }

    
            if (variant.stock < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for product ${product.productName}. Available stock: ${variant.stock}`,
                });
            }

      
            if (product.price !== item.productPrice && variant.price !== item.productPrice) {
                return res.status(400).json({
                    error: `Price inconsistency detected for product ${product.productName}. Please refresh and try again.`,
                });
            }

         
            totalAmount += item.productPrice * item.quantity;
        }

        const razorpayOrder = await razorpayInstance.orders.create({
            amount: totalAmount * 100,
            currency: 'INR',
            receipt: `order_rcptid_${new Date().getTime()}`,
            payment_capture: 1,
        });

        const order = await prisma.order.create({
            data: {
                status: 'pending',
                address: req.body.address,
                userId: userId,
                payment: true,
                totalAmount: totalAmount,
                razorpayOrderId: razorpayOrder.id,
                orderItems: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        variant: item.variant,
                        quantity: item.quantity,
                        productPrice: item.productPrice,
                        variantImage: item.variantImage,
                    })),
                },
            },
            include: {
                orderItems: true,
            },
        });

 
        await prisma.cart.update({
            where: { id: cart.id },
            data: { items: { deleteMany: {} } },
        });


        for (const item of order.orderItems) {
            await prisma.variant.update({
                where: { id: item.variant.id },
                data: { stock: { decrement: item.quantity } },
            });
        }

        res.status(201).json(order);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'An error occurred while placing the order.' });
    }
});


module.exports = router;
