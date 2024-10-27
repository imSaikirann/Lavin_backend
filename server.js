const express = require('express')
const cors = require('cors')
const ProductCatgory = require('./routes/productCategoryRoutes')
const BookProducts = require('./routes/BookRoutes')
const EmailSerices = require('./routes/emailRoutes')
const Payment = require('./routes/payment')
const User = require('./routes/UserRoutes')


const app = express()


//middleware
app.use(express.json())
app.use(cors())

//routes 
app.use('/api/v1/bookProducts',BookProducts)
app.use('/api/v1/productCatgory',ProductCatgory)
app.use('/api/v1',EmailSerices)
app.use('/api/v1/payments',Payment)
app.use('/api/v1/user',User)





app.listen(4000,(req,res)=>{
    console.log("Server i started")
})