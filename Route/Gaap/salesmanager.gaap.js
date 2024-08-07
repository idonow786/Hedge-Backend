const express = require('express');
const router = express.Router();
const multer = require('multer');


//==============Customer
const { getProjectsAll } = require('../../Controller/Gaap/SalesManager/Project/project.gaap');



const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../../Middleware/jwt');





router.get('/projects',verifyToken, getProjectsAll);

module.exports = router;
