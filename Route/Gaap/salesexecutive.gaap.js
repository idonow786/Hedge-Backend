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



//==============DSR
const dsrController = require('../../Controller/Gaap/SalesExecutive/Dsr/dsr.gaap');

//==============Dashboard
const {generateDashboard} = require('../../Controller/Gaap/SalesExecutive/gaap_dashboard');

//Task
const taskController = require('../../Controller/Gaap/SalesExecutive/Task/task.gaap');



//Document
const documentController = require('../../Controller/Gaap/SalesExecutive/gaap_document');

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


//===========DSR
router.post('/add-dsr',verifyToken, dsrController.addDsr);
router.put('/update-dsr',verifyToken, dsrController.updateDsr);
router.delete('/delete-dsr',verifyToken, dsrController.deleteDsr);
router.get('/dsr',verifyToken, dsrController.getDsr);
router.get('/dsr/user',verifyToken, dsrController.getAllDsrForUser);



//==================Task
router.post('/tasks-add',verifyToken, taskController.createTask);
router.put('/tasks-update',verifyToken, taskController.updateTask);
router.delete('/tasks-delete',verifyToken, taskController.deleteTask);
router.get('/projects-get',verifyToken, taskController.getProjectTasks);
router.get('/tasks-projects',verifyToken, taskController.getTask);
router.get('/assign-tasks',verifyToken, taskController.assignTasks);

router.get('/dsr/user',verifyToken, dsrController.getAllDsrForUser);

//===========Dashboard
router.get('/dashboard',verifyToken, generateDashboard);




//===========Document
router.post('/document-add', verifyToken, upload.array('documents'), documentController.addDocument);
router.get('/document-get', verifyToken, documentController.getDocuments);
router.delete('/document-delete', verifyToken, documentController.deleteDocument);

module.exports = router;
