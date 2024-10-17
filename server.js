const express = require('express')
const cors = require('cors')
const ProductCatgory = require('./routes/productCategoryRoutes')
const BookProducts = require('./routes/BookRoutes')
const app = express()


//middleware
app.use(express.json())
app.use(cors())

//routes 
app.use('/api/v1/bookProducts',BookProducts)
app.use('/api/v1/productCatgory',ProductCatgory)


app.listen(4000,(req,res)=>{
    console.log("Server i started")
})