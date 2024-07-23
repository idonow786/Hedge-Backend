const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decodedToken = jwt.decode(token);
  const secretKey = decodedToken.role === 'superadmin' 
  ? process.env.JWT_SECRET_Super 
  : (decodedToken.role === 'admin' 
    ? process.env.JWT_SECRET 
    : process.env.JWT_SECRET_VENDOR);

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
