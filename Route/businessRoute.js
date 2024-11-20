const express = require('express');
const router = express.Router();
const {addBusiness} = require('../Controller/Business/addBusiness')
const {updateBusiness} = require('../Controller/Business/updateBusiness')
const {deleteBusiness} = require('../Controller/Business/deleteBusiness')
const {getBusinesss, getAtisBusinesses, getAccountingBusinesses} = require('../Controller/Business/getBusiness')
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




  


router.post('/add', verifyToken, addBusiness);                                                      //working
router.put('/update', verifyToken, updateBusiness);                                                //working
router.delete('/remove', verifyToken, deleteBusiness);                                                //working
router.get('/get', verifyToken, getBusinesss);                                                        //working
router.get('/get-atis', verifyToken, getAtisBusinesses);                                            //new route
router.get('/get-accounting', verifyToken, getAccountingBusinesses);                                //new route
 
module.exports = router;

