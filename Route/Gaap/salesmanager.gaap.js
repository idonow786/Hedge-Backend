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

const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../../Middleware/jwt');





router.get('/projects', verifyToken, getProjectsAll);





router.post('/add-target', verifyToken, addSalesTarget);
router.get('/get-targets', verifyToken, getManagedUsersData);
router.put('/update-target', verifyToken, updateSalesTarget);
router.delete('/delete-target', verifyToken, deleteSalesTarget);





router.get('/staff', verifyToken, getUsersCreatedByAdmin);

module.exports = router;
