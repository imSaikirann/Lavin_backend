const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const productCategoryRoutes = require('./routes/productCategoryRoutes');
const bookProductsRoutes = require('./routes/BookRoutes');
const emailServicesRoutes = require('./routes/emailRoutes');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/UserRoutes');
const userCartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productSpecificationRoutes = require('./routes/productSpecification');
const deliveryRoutes = require('./routes/deliveryRoutes');




const app = express();
app.use(cookieParser());
 
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));  
const allowedOrigins = [
    'http://localhost:5173', 
    'https://lavin-frontend-16df.vercel.app', 
    'https://lavin.in' 
];

app.use(cors({
    origin: function (origin, callback) {

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }, 
    credentials: true
}));

// Routes
app.use('/api/v1/bookProducts', bookProductsRoutes); 
app.use('/api/v1/productCategory', productCategoryRoutes);
app.use('/api/v1', emailServicesRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/userCart', userCartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/specifications', productSpecificationRoutes);
app.use('/api/v1/delivery', deliveryRoutes);





app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
