const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const ProductCatgory = require('./routes/productCategoryRoutes')
const BookProducts = require('./routes/BookRoutes')
const EmailSerices = require('./routes/emailRoutes')
const Payment = require('./routes/payment')
const User = require('./routes/UserRoutes')
const userCart = require('./routes/cartRoutes')



const app = express()
app.use(cookieParser());

//middleware
app.use(express.json()) 
const allowedOrigins = [
    'http://localhost:5173',
    'https://lavin-frontend-16df.vercel.app'
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

//routes 
app.use('/api/v1/bookProducts',BookProducts)
app.use('/api/v1/productCatgory',ProductCatgory)
app.use('/api/v1',EmailSerices)
app.use('/api/v1/payments',Payment)
app.use('/api/v1/user',User)
app.use('/api/v1/userCart', userCart)






app.listen(4000,(req,res)=>{
    console.log("Server i started")
})