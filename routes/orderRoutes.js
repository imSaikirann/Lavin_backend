const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/userMiddleware');

// Get all orders for admin
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

// Place an order
router.post('/placeOrder', authenticateUser, async (req, res) => {
    const userId = req.user.userId;
    

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        // Retrieve the user's cart with items
        const cart = await prisma.cart.findFirst({
            where: { id: userId },
            include: { items: true },
        });
     

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty. Please add items to your cart before placing an order.' });
        }

        // Create the order with details from cart items
        const order = await prisma.order.create({
            data: {
                status: 'pending',
                address: req.body.address,  // Ensure address is provided in request body
                userId: userId,
                totalAmount: cart.items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0),  // Calculate total amount
                orderItems: {
                    create: cart.items.map(item => ({
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

        // Clear the user's cart after successful order creation
        await prisma.cart.update({
            where: { id: userId },
            data: { items: { deleteMany: {} } },  // Clear all items from the cart
        });

        res.status(201).json(order);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'An error occurred while placing the order.' });
    }
});

module.exports = router;
