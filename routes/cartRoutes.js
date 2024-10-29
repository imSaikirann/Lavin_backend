const express = require('express');
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


router.post('/cart/sync', async (req, res) => {
    const { userId, localCartItems } = req.body;


    try {
      
        let cart = await prisma.cart.findUnique({
            where: { id:userId },
            include: { items: true },
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    id: userId,
                    user: {
                        connect: { id: userId } 
                    },
                },
                include: { items: true },
            });
        }
        
    
        for (const localItem of localCartItems) {
            const { productId, variant, variantIndex, quantity, productPrice, variantImage } = localItem;

            // Check if the item already exists in the database cart
            const existingCartItem = cart.items.find(
                item => item.productId === productId && item.variantIndex === variantIndex
            );

            if (existingCartItem) {
             
                await prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: { quantity: existingCartItem.quantity + quantity },
                });
            } else {
                // Add a new item to the cart
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId,
                        variant,
                        variantIndex,
                        quantity,
                        productPrice,
                        variantImage,
                    },
                });
            }
        }

        res.status(200).json({ message: 'Cart synced successfully' });
    } catch (error) {
        console.error('Error syncing cart:', error.message);
        res.status(500).json({ message: 'Error syncing cart', error: error.message });
    }
});




router.get('/getCartItems/:id', async (req, res) => {
    const { id } = req.params;  // Use 'id' to access the route parameter

    try {
        const cart = await prisma.cart.findUnique({
            where: { id },  // Query using 'id' for userId
            include: { items: true },
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        res.status(200).json({ cart });
    } catch (error) {
        console.error('Error fetching cart:', error.message);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
});



module.exports = router