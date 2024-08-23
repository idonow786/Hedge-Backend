const express = require('express');
const router = express.Router();
const multer = require('multer');


//==============Customer
const { getProjectsAll } = require('../../Controller/Gaap/SalesManager/Project/project.gaap');

//==============Target
const { addSalesTarget,
    getManagedUsersData,
    updateSalesTarget,
    deleteSalesTarget } = require('../../Controller/Gaap/SalesManager/Target/target.gaap');




//==============Staff
const { getUsersCreatedByAdmin } = require('../../Controller/Gaap/SalesManager/Staff/staff.gaap');




//==============Dashboard
const { getDashboardData } = require('../../Controller/Gaap/SalesManager/gaap_dashboard');


//==============Profile
const { updateUserProfile } = require('../../Controller/Gaap/SalesManager/Profile/update.profile');
const { getUserProfile } = require('../../Controller/Gaap/SalesManager/Profile/get.profile');



const { generateAndSendProposal } = require('../../Controller/Gaap/SalesManager/gaap_email');




const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../../Middleware/jwt');





router.get('/projects', verifyToken, getProjectsAll);





router.post('/add-target', verifyToken, addSalesTarget);
router.get('/get-targets', verifyToken, getManagedUsersData);
router.put('/update-target', verifyToken, updateSalesTarget);
router.delete('/delete-target', verifyToken, deleteSalesTarget);





router.get('/staff', verifyToken, getUsersCreatedByAdmin);




router.get('/dashboard', verifyToken, getDashboardData);




router.put('/update-profile', verifyToken, updateUserProfile);
router.get('/profile', verifyToken, getUserProfile);




router.post('/send-email', verifyToken, generateAndSendProposal);





module.exports = router;
