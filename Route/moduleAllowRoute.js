const express = require('express');
const router = express.Router();
const { 
  createModuleAllow, 
  getModuleAllow, 
  updateModuleAllow, 
  deleteModuleAllow 
} = require('../Controller/Admin/moduleAllow.controller');
const { verifyToken } = require('../Middleware/jwt');

// 🛣️ Module permission routes
router.post('/create', verifyToken, createModuleAllow);
router.get('/get', verifyToken, getModuleAllow);
router.put('/update', verifyToken, updateModuleAllow);
router.delete('/delete', verifyToken, deleteModuleAllow);

module.exports = router; 

