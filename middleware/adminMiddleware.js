const jwt = require('jsonwebtoken');

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try { 
    const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN); 
    req.admin = decoded; 
    console.log(decoded);
 

    next(); 
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please reauthenticate' });
    }
    return res.status(403).json({ error: 'Token is not valid' });
  }
};

module.exports = authenticateUser;
