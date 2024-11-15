const { PrismaClient } = require('@prisma/client');
const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/userMiddleware');
const Razorpay = require('razorpay');
const axios = require('axios');
require('dotenv').config();
const crypto = require('crypto');


const prisma = new PrismaClient();
const razorpayInstance = new Razorpay({
    key_id: process.env.VITE_RAZORPAY_LIVE_ID,
    key_secret: process.env.VITE_RAZORPAY_SECRET_KEY,
});

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;


// Function to check pincode availability
async function checkPincodeAvailability(pincode) {
    try {
        const response = await axios.get(`https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`, {
            headers: {
                'Authorization': `Bearer ${DELHIVERY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.data && response.data.delivery_codes) {
            const postalCodeData = response.data.delivery_codes[0].postal_code;
            return {
                status: 'success',
                pincode: postalCodeData.pin,
                city: postalCodeData.city,
                is_serviceable: postalCodeData.is_oda === 'N',
                cod_available: postalCodeData.cod === 'Y',
                prepaid_available: postalCodeData.pre_paid === 'Y',
                pickup_available: postalCodeData.pickup === 'Y',
            };
        } else {
            return { status: 'error', message: 'No data available for this pincode.' };
        }
    } catch (error) {
        console.error( 'Error checking pincode availability:', error.message);
        return { status: 'error', message: 'Unable to check pincode availability.' };
    }
}

// Calculate total weight of items
const calculateTotalWeight = async (items) => {
    let totalWeight = 0;
    for (const item of items) {
        const productSpec = await prisma.productSpecification.findFirst({
            where: { productId: item.productId },
        });
        totalWeight += (productSpec?.weight || 0) * item.quantity;
        console.log(totalWeight)
    }
    return totalWeight;
};

// Middleware to check pincode availability
async function checkPincodeMiddleware(req, res, next) {
    const { address } = req.body;
    if (!address || !address.pinCode) {
        return res.status(400).json({ error: 'Pincode is required in the address.' });
    }

    try {
        const pincodeData = await checkPincodeAvailability(address.pinCode);
        if (pincodeData.status === 'error' || !pincodeData.is_serviceable) {
            return res.status(400).json({ message: 'The provided pincode is not serviceable.' });
        }
        req.pincodeData = pincodeData;
        next();
    } catch (error) {
        console.error('Error checking pincode:', error);
        res.status(500).json({ error: 'An error occurred while checking pincode availability.' });
    }
}

// Fetch shipping cost from Delhivery API
const getShippingCost = async (destinationPin, originPin, weight) => {
    try {
        const response = await axios.get(`https://track.delhivery.com/api/kinko/v1/invoice/charges/.json`, {
            params: {
                md: 'S',
                ss: 'Delivered',
                d_pin: destinationPin,
                o_pin: originPin,
                cgm: weight,
                pt: 'Pre-paid'
            },
            headers: {
                'Authorization': `Token ${DELHIVERY_API_KEY}`, // Ensure DELHIVERY_API_KEY is set correctly
                'Content-Type': 'application/json'              // Add Content-Type header
            }
        });

        return response.data[0]?.total_amount || 0;
    } catch (error) {
        console.error('Error fetching shipping cost:', error.response?.data || error.message);
        return 0;
    }
};

const createShipment = async (order) => {
    try {
        console.log('Order Received:', order);

        const shippingAddress = order.address;
        const items = order.orderItems;

        // Ensure utility functions exist
        if (typeof calculateTotalWeight !== 'function' || typeof calculateTotalAmount !== 'function') {
            throw new Error('Utility functions calculateTotalWeight or calculateTotalAmount are missing.');
        }

     
        const totalWeight = await calculateTotalWeight(items);

       
        const shipmentDetails = {
            order_id: order?.id || '',
            payment_mode: 'Pre-paid', 
            pickup_location: "Lavin Visionaire", 

            fragile_shipment: false,
            customer_phone: order?.phone || '', 
            address: {
                line1: shippingAddress?.line1 || '',
                line2: shippingAddress?.line2 || '',
                city: shippingAddress?.city || '', 
                state: shippingAddress?.state || '',
                pin_code: shippingAddress?.pinCode || '', 
                country: shippingAddress?.country || 'India', 
            },
            items: items?.map(item => ({
                product_id: item.productId || '', 
                quantity: item.quantity || 1, 
                weight: item.weight || 200, 
                price: item.productPrice || 0, 
            })) || [], 
            total_weight: totalWeight || 0, 
            total_value: calculateTotalAmount(items) || 0, 
            end_date: "2024-11-16", 
        };

        console.log('Shipment Details:', shipmentDetails);

        // Make the request to Delhivery API
        const response = await axios.post(
            'https://staging-express.delhivery.com/api/cmu/create.json',
            {
                format: 'json',
                data: JSON.stringify(shipmentDetails), // Ensure shipment details are stringified
            },
            {
                headers: {
                    Authorization: `Bearer ${DELHIVERY_API_KEY}`, // Ensure DELHIVERY_API_KEY is set correctly
                    'Content-Type': 'application/json',
                },
            }
        );

        // Handle response
        if (response.data && response.data.success) {
            console.log('Shipment Created Successfully:', response.data);
            return { status: 'success', trackingId: response.data.tracking_id };
        } else {
            console.log(response)
            const errorMessage = response.data || 'Unknown error from Delhivery API';
            throw new Error('Failed to create shipment: ' + errorMessage);
        }
    } catch (error) {
        console.error('Error creating shipment:', error.message);
        return { status: 'error', message: error.message };
    }
};


// Helper function to calculate total amount
const calculateTotalAmount = (items) => {
    return items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
};

// Route to fetch all orders
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

// Route to create an order
router.post('/create-order', authenticateUser, checkPincodeMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { address, phone, items } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {

        let totalAmount = calculateTotalAmount(items);
        const totalWeight = await calculateTotalWeight(items);
        const originPin = '500073';
        const shippingCharges = await getShippingCost(address.pinCode, originPin, totalWeight);
        console.log(shippingCharges);

        totalAmount += shippingCharges;
        console.log(totalAmount);


        const razorpayOrder = await razorpayInstance.orders.create({
            amount: totalAmount * 100,
            currency: 'INR',
            receipt: `order_rcptid_${new Date().getTime()}`,
            payment_capture: 1,
        });


        const order = await prisma.order.create({
            data: {
                status: 'pending',
                address: typeof address === 'object' ? address : JSON.parse(address),
                phone,
                userId: userId,
                payment: false,
                totalAmount: totalAmount,
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

        // Update stock based on items in the order
        for (const item of items) {
            await prisma.variant.update({
                where: { id: item.variant.id },
                data: { stock: { decrement: item.quantity } },
            });
        }
        // Send the response back with the Razorpay order details and shipping charges
        res.status(201).json({
            status: 'Order created',
            order,
            razorpayOrderId: razorpayOrder.id,
            shippingCharges,
        });

    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'An error occurred while creating Razorpay order.' });
    }
});


router.post('/razorpay-webhook', async (req, res) => {
    const secret = process.env.VITE_RAZORPAY_SECRET_KEY;

    if (!secret) {
        return res.status(500).json({ error: 'Razorpay secret key not found.' });
    }

    console.log("Full Request Body:", JSON.stringify(req.body, null, 2));

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address, phone, userId, totalAmount, razorpayOrder, items } = req.body;

    const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    console.log("Received Signature:", razorpay_signature);
    console.log("Generated Signature:", generated_signature);

    if (generated_signature === razorpay_signature) {
        // Payment verification is successful
        try {
            // Update the order status to 'payment done'
            const order = await prisma.order.update({
                where: { razorpayOrderId: razorpay_order_id }, // This should work now that razorpayOrderId is unique
                data: {
                    payment: true, // Mark payment as done
                },
                include: { orderItems: true },
            });

            // Create shipment after payment verification
            const shipmentData = await createShipment(order);

            if (shipmentData.status === 'success') {
                // Update the order status to 'shipped'
                await prisma.order.update({
                    where: { razorpayOrderId: razorpay_order_id },
                    data: { status: 'shipped', shipmentTrackingId: shipmentData.trackingId },
                });

                res.status(200).json({ success: true, message: 'Payment successful, shipment created, and order updated.' });
            } else {
                res.status(500).json({ success: false, message: 'Failed to create shipment.' });
            }
        } catch (error) {
            console.error('Error during payment verification or shipment creation:', error);
            res.status(500).json({ error: 'An error occurred while processing the payment and creating shipment.' });
        }
    } else {
        // Invalid signature
        res.status(400).json({ success: false, error: 'Payment verification failed' });
    }
});




// Route to place an order
router.post('/placeOrder', authenticateUser, checkPincodeMiddleware, async (req, res) => {
    const userId = req.user.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const cart = await prisma.cart.findFirst({
            where: { userId },
            include: { items: true },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Your cart is empty. Please add items to your cart before placing an order.' });
        }

        const totalAmount = calculateTotalAmount(cart.items);
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
                userId,
                payment: true,
                totalAmount,
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
            include: { orderItems: true },
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
