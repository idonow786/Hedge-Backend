const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }


  const secretKeys = [
    process.env.JWT_SECRET,
    process.env.JWT_SECRET_Super,
    process.env.JWT_SECRET_VENDOR,
    process.env.JWT_SECRET_GAAP,
    process.env.JWT_SECRET_GAAP_USER,
    process.env.JWT_ATIS_USER,
  ];
  let decoded;
  let lastError;
  for (let secretKey of secretKeys) {
    try {
      decoded = jwt.verify(token, secretKey);
      break;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (!decoded) {
    console.error('Token verification failed with all keys. Last error:', lastError);
    if (lastError.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token signature' });
    } else if (lastError.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    } else {
      return res.status(401).json({ message: 'Invalid token', error: lastError.message });
    }
  }


  req.adminId = decoded.userId;
  req.username = decoded.username;
  req.email = decoded.email;
  req.role = decoded.role;

  next();
};

module.exports = { verifyToken };
