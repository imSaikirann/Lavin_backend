const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try { 
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = decoded; 
    console.log(decoded);
    console.log(req.user.id)

    next(); 
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please reauthenticate' });
    }
    return res.status(403).json({ error: 'Token is not valid' });
  }
};

module.exports = authenticateUser;
