const express = require('express');
const router = express.Router();

const { getAllProjectsWithPayments} = require('../../Controller/Gaap/Financial/project/project.gaap')
const { addInvoice} = require('../../Controller/Gaap/Financial/invoice/addInvoice.gaap')
const { getUnpaidProjects,updatePayment,getProjectsWithPaymentStatus} = require('../../Controller/Gaap/Financial/invoice/unpaid.gaap')
const { getDashboardData} = require('../../Controller/Gaap/Financial/gaap_dashboard')

const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.get('/get-projects',verifyToken, getAllProjectsWithPayments);                                    //
router.post('/add-invoice',verifyToken, addInvoice);       



router.put('/update-unpaidInvoice',verifyToken, updatePayment);                                         //
router.get('/get-unPaidinvoice',verifyToken, getUnpaidProjects);                                        //
router.get('/get-payment-status',verifyToken, getProjectsWithPaymentStatus);                            //
router.get('/get-dashboard',verifyToken, getDashboardData);                            //








module.exports = router;

