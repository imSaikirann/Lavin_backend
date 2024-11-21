const jwt = require('jsonwebtoken');

const generateToken = (user)=>{
    return jwt.sign({id:user.id,email:user.email},
        process.env.JWT_SECRET,
        {expiresIn:"15d"}
    )
}



module.exports = {
    generateToken
} 