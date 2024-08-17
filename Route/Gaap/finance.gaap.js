const express = require('express');
const router = express.Router();

const { getAllProjectsWithPayments} = require('../../Controller/Gaap/Financial/project/project.gaap')
const { addInvoice} = require('../../Controller/Gaap/Financial/invoice/addInvoice.gaap')
const { getProjectsWithInvoiceStatus,updatePayment,getProjectsWithPaymentStatus} = require('../../Controller/Gaap/Financial/invoice/unpaid.gaap')
const { getDashboardData} = require('../../Controller/Gaap/Financial/gaap_dashboard')
const { createReport,getAllReports,updateReport,deleteReport,getReportByDate} = require('../../Controller/Gaap/Financial/dcr/dcr.gaap')
const quotationController = require('../../Controller/Gaap/Financial/project/projectStatus.gaap')

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
router.get('/get-unPaidinvoice',verifyToken, getProjectsWithInvoiceStatus);                                        //
router.get('/get-payment-status',verifyToken, getProjectsWithPaymentStatus);                            //
router.get('/get-dashboard',verifyToken, getDashboardData);                                             //



router.post('/created-dcr',verifyToken, createReport);                                             //
router.get('/get-dcr',verifyToken, getAllReports);                                            //
router.put('/update-dcr',verifyToken, updateReport);                                             //
router.delete('/delete-dcr',verifyToken, deleteReport);                                             //
router.get('/dcr-date',verifyToken, getReportByDate);                                          //




router.post('/view-quotation',verifyToken, quotationController.viewQuotation);
router.post('/approve-quotation',verifyToken, quotationController.approveQuotation);







module.exports = router;

