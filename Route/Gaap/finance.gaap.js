const express = require('express');
const router = express.Router();

const { getAllProjectsWithPayments} = require('../../Controller/Gaap/Financial/project/project.gaap')
const { addInvoice} = require('../../Controller/Gaap/Financial/invoice/addInvoice.gaap')
const { getUnpaidProjects,updatePayment} = require('../../Controller/Gaap/Financial/invoice/unpaid.gaap')

const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.get('/get-projects',verifyToken, getAllProjectsWithPayments);                                         //
router.post('/add-invoice',verifyToken, addInvoice);       



router.put('/update-unpaidInvoice',verifyToken, updatePayment);                                         //
router.get('/get-unPaidinvoice',verifyToken, getUnpaidProjects);                                         //







module.exports = router;

