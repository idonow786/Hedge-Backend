const express = require('express');
const router = express.Router();
const multer = require('multer');
const { registerCustomer } = require('../../Controller/Gaap/SalesExecutive/Customer/add.customer.gaap');
const { updateCustomer } = require('../../Controller/Gaap/SalesExecutive/Customer/update.customer.gaap');
const { getAllCustomersByAdmin } = require('../../Controller/Gaap/SalesExecutive/Customer/get.customer.gaap');
const { deleteCustomer } = require('../../Controller/Gaap/SalesExecutive/Customer/delete.customer.gaap');

const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../../Middleware/jwt');

router.post('/add-customer',
    upload.fields([
        { name: 'tradeLicense', maxCount: 1 },
        { name: 'vatCertificate', maxCount: 1 },
        { name: 'otherDocuments', maxCount: 5 }
    ]),
    verifyToken,
    registerCustomer
);
router.put('/update-customer',
    upload.fields([
        { name: 'tradeLicense', maxCount: 1 },
        { name: 'vatCertificate', maxCount: 1 },
        { name: 'otherDocuments', maxCount: 5 }
    ]),
    verifyToken,
    updateCustomer
);

router.get('/customers', verifyToken, getAllCustomersByAdmin);
router.delete('/delete-customer', verifyToken, deleteCustomer);


module.exports = router;
