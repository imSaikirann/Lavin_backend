const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/userMiddleware')

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


router.post('/cart/sync', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    const { localCartItems } = req.body;
    console.log(localCartItems)


    try {
      
        let cart = await prisma.cart.findFirst({
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

router.delete('/cart/removeProduct', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    const {  productId, variantId } = req.body;


    try {
        const cart = await prisma.cart.findFirst({
            where: { id: userId },
            include: { items: true },
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const existingCartItem = cart.items.find(
            item => item.productId === productId && item.variant.id === variantId
        );

        if (!existingCartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await prisma.cartItem.delete({
            where: { id: existingCartItem.id },
        });

        res.status(200).json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        console.error('Error removing item from cart:', error.message);
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});

router.post('/cart/addProduct', authenticateUser, async (req, res) => {
    const userId = req.user.userId;  
    const { productId, variant, variantIndex, quantity, productPrice, variantImage } = req.body;

    try {
        // Find the user's cart based on userId
        let cart = await prisma.cart.findUnique({
            where: { id: userId },
            include: { items: true },
        });

    
        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    id: userId,  
                    user: { connect: { id: userId } },
                },
                include: { items: true },
            });
        }

   
        const existingCartItem = cart.items.find(
            item => item.productId === productId && item.variantIndex === variantIndex
        );

        if (existingCartItem) {
            // Update the quantity if the item already exists in the cart
            await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: {
                    quantity: existingCartItem.quantity + quantity,
                },
            });

            return res.status(200).json({ message: 'Product quantity updated in cart' });
        }

        // Add a new item to the cart if it doesn't already exist
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

        res.status(201).json({ message: 'Product added to cart successfully' });
    } catch (error) {
        console.log(error)
        console.error('Error adding product to cart:', error.message);
        res.status(500).json({ message: 'Error adding product to cart', error: error.message });
    }
});



router.patch('/cart/updateQuantity', authenticateUser, async (req, res) => {
    const userId = req.user.id;

    const {  productId, variantIndex, newQuantity } = req.body;
    console.log(variantIndex)
    try {
        const cart = await prisma.cart.findFirst({
            where: { id: userId },
            include: { items: true },
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const existingCartItem = cart.items.find(
            item => item.productId === productId && item.variant.id === variantIndex
        );

        if (!existingCartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: newQuantity },
        });

        res.status(200).json({ message: 'Cart item quantity updated successfully' });
    } catch (error) {
        console.error('Error updating cart item quantity:', error.message);
        res.status(500).json({ message: 'Error updating cart item quantity', error: error.message });
    }
});

router.get('/getCartItems',authenticateUser, async (req, res) => {
    const userId = req.user.id;

    try {
        const cart = await prisma.cart.findFirst({
            where: { id:userId },  
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