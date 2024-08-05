
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const GaapUser = require('../../../Model/Gaap/gaap_user');

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await GaapUser.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive. Please contact an administrator.' });
    }

    const secretKey =process.env.JWT_SECRET_GAAP_USER;
    const token = jwt.sign(
      { userId: user._id, username: user.username, email: user.email, role: user.role },
      secretKey,
      { expiresIn: '30d' }
    );

    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

module.exports={loginUser}