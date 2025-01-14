const LoginResponse = require('../../Model/LoginResponse');
const jwt = require('jsonwebtoken');

// 💾 Save login response
const saveLoginResponse = async (req, res) => {
  try {
    const loginData = req.body;
    const userId = loginData.user.id;

    // 🔄 Update or create new login response
    const updatedResponse = await LoginResponse.findOneAndUpdate(
      { userId }, // 🔍 Find by userId
      loginData,  // 📝 Update with new data
      { 
        new: true,        // 👈 Return updated document
        upsert: true,     // 🆕 Create if doesn't exist
        runValidators: true // ✅ Run schema validators
      }
    );

    // 🎯 Format response exactly like login response
    const formattedResponse = {
      message: updatedResponse.message,
      token: updatedResponse.token,
      role: updatedResponse.role,
      features: updatedResponse.features,
      totals: updatedResponse.totals,
      modulePermissions: updatedResponse.modulePermissions,
      user: updatedResponse.user,
      business: updatedResponse.business
    };

    res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Error saving login response:', error);
    res.status(500).json({ 
      message: 'Error saving login response',
      error: error.message 
    });
  }
};

// 🔍 Get login response by token
const getLoginResponseByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // 🔐 Decode token to get userId
    const decoded = jwt.decode(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // 🔍 Find login response by userId
    const loginResponse = await LoginResponse.findOne({ userId: decoded.userId });

    if (!loginResponse) {
      return res.status(404).json({ message: 'Login response not found' });
    }

    // 🎯 Format response exactly like login response
    const formattedResponse = {
      message: loginResponse.message,
      token: loginResponse.token,
      role: loginResponse.role,
      features: loginResponse.features,
      totals: loginResponse.totals,
      modulePermissions: loginResponse.modulePermissions,
      user: loginResponse.user,
      business: loginResponse.business
    };

    res.status(200).json(formattedResponse);

  } catch (error) {
    console.error('Error retrieving login response:', error);
    res.status(500).json({ 
      message: 'Error retrieving login response',
      error: error.message 
    });
  }
};

module.exports = {
  saveLoginResponse,
  getLoginResponseByToken
}; 