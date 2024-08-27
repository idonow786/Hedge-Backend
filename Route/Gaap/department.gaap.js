const express = require('express');
const router = express.Router();

const { getProjects} = require('../../Controller/Gaap/Department/Project/projects.gaap')
const { generateReports} = require('../../Controller/Gaap/Department/Report/report.gaap')
const { getDashboardData} = require('../../Controller/Gaap/Department/dashboard.gaap')
const { getDashboardDataDepartment} = require('../../Controller/Gaap/Department/dashboardDep.gaap')


const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.get('/get-projects',verifyToken, getProjects);                                         //
router.get('/get-reports',verifyToken, generateReports);       



//
router.get('/dashboard',verifyToken, getDashboardData);                                         //
router.get('/dashboard-get',verifyToken, getDashboardDataDepartment);                                         //
                                   //






module.exports = router;

