const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decodedToken = jwt.decode(token);
  let secretKey;

  switch (decodedToken.role) {
    case 'superadmin':
      secretKey = process.env.JWT_SECRET_Super;
      break;
    case 'vendor':
      secretKey = process.env.JWT_SECRET_VENDOR;
      break;
    case 'gaapadmin':
      secretKey = process.env.JWT_SECRET_GAAP;
      break;
    default:
      secretKey = process.env.JWT_SECRET;
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.adminId = decoded.userId;
    req.username = decoded.username;
    req.email = decoded.email;
    req.role = decoded.role;

    next();
  });
};

module.exports = { verifyToken };
