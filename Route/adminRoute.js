const express = require('express');
const router = express.Router();
const {signup,signin, updateUser,deleteUser} = require('../Controller/Admin/Registration');
const { verifyOtp,generateOtp,updatePassword } = require('../Controller/Admin/ForgetPassword');
const {deletePayment,updatePayment,addPayment,getPayments} = require('../Controller/Admin/paymentController');
const {getAdminProfile,getAllUsersWithBusinesses,DeleteUser,getAtisUsers,getAccountingUsers} = require('../Controller/Admin/profile');
const {updateAdminProfile} = require('../Controller/Admin/updateProfile');
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  



  

router.post('/signup',verifyToken, signup);                                                                                   //working
router.put('/update/user',verifyToken, updateUser);                                                                                   //working
router.delete('/delete/user',verifyToken, deleteUser);                                                                                   //working

router.post('/signin', signin);                                                                                   //working
router.get('/profile',verifyToken, getAdminProfile);                                                              //working
router.put('/profile/update', verifyToken, upload.single('profilePic'), updateAdminProfile);                      //working




router.post('/generate/otp', generateOtp);                                                                          //working
router.post('/verify/otp', verifyOtp);                                                                               //working
router.post('/update/password', updatePassword);                                                                     //working

router.post('/all/users',verifyToken, getAllUsersWithBusinesses);                                                                          //working
router.delete('/users',verifyToken, DeleteUser);                                                                          //working

router.get('/users/atis', verifyToken, getAtisUsers);
router.get('/users/accounting', verifyToken, getAccountingUsers);

router.post('/payment',verifyToken, addPayment);                                                                          //working
router.put('/payment/update',verifyToken, updatePayment);                                                                          //working
router.delete('/payment/delete',verifyToken, deletePayment);                                                                          //working
router.get('/payment',verifyToken, getPayments);                                                                          //working


module.exports = router;
