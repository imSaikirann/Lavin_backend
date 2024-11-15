const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
const express = require('express');
const router = express.Router();

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY;

router.get("/checkPincode/:pincode", async (req, res) => {
    const { pincode } = req.params;
    console.log(pincode)

    try {
        const response = await axios.get(
            `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`,
            {
                headers: {
                    'Authorization': DELHIVERY_API_KEY, // Adjusted per Delhivery's typical API key format
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.delivery_codes && response.data.delivery_codes.length > 0) {
            const postalCodeData = response.data.delivery_codes[0].postal_code;

            res.status(200).json({
                status: 'success',
                data: {
                    pincode: postalCodeData.pin,
                    city: postalCodeData.city,
                    is_serviceable: postalCodeData.is_oda === 'N',
                    cod_available: postalCodeData.cod === 'Y',
                    prepaid_available: postalCodeData.pre_paid === 'Y',
                    pickup_available: postalCodeData.pickup === 'Y',
                }
            });
        } else {
            res.status(404).json({
                is_serviceable:false,
                status: 'error',
                message: 'No data available for this pincode.'
            });
        }
    } catch (error) {
        console.error('Error checking pincode availability:', error.message);

        res.status(500).json({
            status: 'error',
            message: 'Unable to check pincode availability. Please try again later.'
        });
    }
});

module.exports = router;
