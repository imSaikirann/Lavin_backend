const jwt = require('jsonwebtoken');

// Main authentication middleware
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  
    next(); 
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
 
      return refreshToken(req, res, next);
    }
    return res.status(403).json({ error: 'Token is not valid' });
  }
};

// Refresh token middleware
const refreshToken = (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token provided' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);


    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );


    res.setHeader('Authorization', `Bearer ${newAccessToken}`);
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // Make sure this is false for local development
      sameSite: 'Lax', // Allows sending cookies across different domains on localhost
      maxAge: 24 * 60 * 60 * 1000 // Cookie expiration time
  });
  


    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Refresh token is not valid' });
  }
};

module.exports =  authenticateUser;
