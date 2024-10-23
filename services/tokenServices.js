const jwt = require('jsonwebtoken');

const generateToken = (user)=>{
    return jwt.sign({userId:user.id,email:user.email},
        process.env.JWT_SECRET,
        {expiresIn:"15m"}
    )
}


const generateRefreshToken = (user)=>{
    return jwt.sign({userId:user.id,email:user.email},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:"7d"}
    )
}

module.exports = {
    generateToken,generateRefreshToken
}