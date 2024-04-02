const express = require('express');
const router = express.Router();
const { createInvoice } = require('../Controller/Invoice/addInvoice')
const { deleteInvoice } = require('../Controller/Invoice/deleteInvoice')
const { updateInvoice } = require('../Controller/Invoice/updateInvoice')
const { getInvoices } = require('../Controller/Invoice/getInvoice')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.post('/add', verifyToken, upload.single('pic'), createInvoice);                                                               //working
router.delete('/delete', verifyToken, deleteInvoice);                                                                                //nworking
router.post('/update', verifyToken, upload.single('pic'), updateInvoice);                                                            //working
router.get('/get', verifyToken, getInvoices);                                                                                        //working


module.exports = router;
