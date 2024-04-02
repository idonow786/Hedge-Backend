const express = require('express');
const router = express.Router();
const { generateReports } = require('../Controller/Report/generateReport')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
 
router.get('/generate', verifyToken, generateReports);                                                             //working



module.exports = router;
