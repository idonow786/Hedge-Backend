const express = require('express');
const router = express.Router();
const multer = require('multer');


//==============Customer
const { registerCustomer } = require('../../Controller/Gaap/SalesExecutive/Customer/add.customer.gaap');
const { updateCustomer } = require('../../Controller/Gaap/SalesExecutive/Customer/update.customer.gaap');
const { getAllCustomersByAdmin } = require('../../Controller/Gaap/SalesExecutive/Customer/get.customer.gaap');
const { deleteCustomer } = require('../../Controller/Gaap/SalesExecutive/Customer/delete.customer.gaap');

//==============Project
const { createProject,getProjects,updateProject,deleteProject,getAllProjectsWithComments } = require('../../Controller/Gaap/SalesExecutive/Project/project.gaap');


const upload = multer({ storage: multer.memoryStorage() });
const { verifyToken } = require('../../Middleware/jwt');




//==============Customer
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


//==============Project
router.post('/add-project',
    upload.fields([
        { name: 'vatCertificate', maxCount: 1 },
        { name: 'documents', maxCount: 5 }
    ]),
    verifyToken,
    createProject
);
router.put('/update-project',
    upload.fields([
        { name: 'vatCertificate', maxCount: 1 },
        { name: 'documents', maxCount: 5 }
    ]),
    verifyToken,
    updateProject
);
router.get('/projects',

    verifyToken,
    getProjects
);
router.delete('/delete-project',
    verifyToken,
    deleteProject
);
router.get('/ongoing-project',
    verifyToken,
    getAllProjectsWithComments
);





module.exports = router;
