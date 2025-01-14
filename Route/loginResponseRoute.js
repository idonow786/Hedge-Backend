const express = require('express');
const router = express.Router();
const { 
  saveLoginResponse, 
  getLoginResponseByToken,
  logoutUser 
} = require('../Controller/Admin/loginResponse.controller');

// 💾 Save login response
router.post('/save', saveLoginResponse);

// 🔍 Get login response by token
router.get('/get/:token', getLoginResponseByToken);

// 🚪 Logout route
router.delete('/logout/:token', logoutUser);

module.exports = router; 