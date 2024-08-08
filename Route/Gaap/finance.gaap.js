const express = require('express');
const router = express.Router();

const { getAllProjectsWithPayments} = require('../../Controller/Gaap/Financial/project/project.gaap')

const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.get('/get-projects',verifyToken, getAllProjectsWithPayments);                                         //







module.exports = router;

