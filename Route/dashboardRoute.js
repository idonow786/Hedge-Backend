const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../Controller/Dashboard/generateDashboard')
// const { getDashboardData } = require('../Controller/Dashboard/getDashboard')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
 
router.post('/generate', verifyToken, getDashboardData);                                                                                //working
// router.get('/get', verifyToken, getDashboardData);        .                                                                                   //no test



module.exports = router;
