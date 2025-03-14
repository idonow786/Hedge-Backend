const express = require('express');
const router = express.Router();

const { registerUser} = require('../../Controller/Gaap/Parent/register.gaap')
const { updateUser} = require('../../Controller/Gaap/Parent/update.gaap')
const { deleteUser} = require('../../Controller/Gaap/Parent/delete.gaap')
const { fetchGaapUsers} = require('../../Controller/Gaap/Parent/get.gaap')
const productController = require('../../Controller/Gaap/Parent/product.gaap');
const gaapInvoiceController = require('../../Controller/Gaap/Parent/invoices.gaap');
const branchController = require('../../Controller/Gaap/Parent/branch.gaap');
const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

// User routes
router.post('/add-users',verifyToken, registerUser);                                         
router.put('/update-users',verifyToken, updateUser);                                         
router.delete('/delete-users', verifyToken, deleteUser);                                     
router.get('/get-users', verifyToken, fetchGaapUsers);                                      

// Branch routes
router.post('/branches', verifyToken, branchController.createBranch);
router.get('/branches', verifyToken, branchController.getAllBranches);
router.get('/branches/:branchId', verifyToken, branchController.getBranch);
router.put('/branches/:branchId', verifyToken, branchController.updateBranch);
router.delete('/branches/:branchId', verifyToken, branchController.deleteBranch);

// Invoice routes
router.get('/get-invoices', verifyToken, gaapInvoiceController.getAllInvoices);                                      

// Product routes
router.post('/save-all-products',verifyToken, productController.saveAllProducts);
router.get('/fixed-price-products',verifyToken, productController.getAllFixedPriceProducts);
router.get('/variable-price-products',verifyToken, productController.getAllVariablePriceProducts);

module.exports = router;




