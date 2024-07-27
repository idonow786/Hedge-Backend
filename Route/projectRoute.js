const express = require('express');
const router = express.Router();
const { addProject } = require('../Controller/Project/addProject')
const { deleteProject } = require('../Controller/Project/deleteProject')
const { getProjects,getProjectsByCustomerId } = require('../Controller/Project/getProject')
const { updateProject } = require('../Controller/Project/updateProject')


const { addProjectConstruction } = require('../Controller/Project/addProjectConstruction')
const { updateProjectConstruction } = require('../Controller/Project/updateProjectContruction')
const { getConstructionProjects,getProjectContruct } = require('../Controller/Project/getConstruction')
const { deleteProjectConstruction } = require('../Controller/Project/deleteContruction')
const { getProjectExpenses } = require('../Controller/Project/getProjectExpense')
const { getProjectExpensesC } = require('../Controller/Project/getProjectConstructionEx')
const { updateProjectStatus } = require('../Controller/Project/updateStatus')


const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});
 
router.post('/add', verifyToken, addProject);                                                                                       //working
router.delete('/delete', verifyToken, deleteProject);                                                                               //working
router.post('/update', verifyToken, upload.single('pic'), updateProject);                                                           //working
router.get('/get', verifyToken,  getProjects);                                                                                      //working
router.get('/get/projects/customer', verifyToken, getProjectsByCustomerId);      



// Route for adding a new construction project
router.post(
  '/add-project',
  verifyToken,
  upload.fields([
    { name: 'documentation[contracts]', maxCount: 5 },
    { name: 'documentation[permits]', maxCount: 5 },
    { name: 'documentation[plansAndDrawings]', maxCount: 10 },
    { name: 'documentation[reports]', maxCount: 10 },
    { name: 'documentation[correspondence]', maxCount: 10 },
    { name: 'documentation[safetyReports]', maxCount: 5 },
    { name: 'documentation[qualityReports]', maxCount: 5 },
    { name: 'documentation[progressReports]', maxCount: 10 },
    { name: 'documentation[financialReports]', maxCount: 5 },
    { name: 'documentation[environmentalReports]', maxCount: 5 },
    { name: 'documentation[changeOrders]', maxCount: 10 },
    { name: 'documentation[submittals]', maxCount: 10 },
    { name: 'documentation[inspectionReports]', maxCount: 10 },
    { name: 'documentation[meetingMinutes]', maxCount: 20 },
    { name: 'documentation[photos]', maxCount: 50 },
    { name: 'documentation[warranties]', maxCount: 5 },
    { name: 'documentation[asBuiltDrawings]', maxCount: 10 },
    { name: 'documentation[operationManuals]', maxCount: 5 },
    { name: 'documentation[certifications]', maxCount: 5 },
    { name: 'documentation[insuranceDocuments]', maxCount: 5 }
  ]),
  addProjectConstruction
);


// Route for updating an existing project
router.put(
  '/update-project',
  verifyToken,
  upload.fields([
    { name: 'documentation[contracts]', maxCount: 5 },
    { name: 'documentation[permits]', maxCount: 5 },
    { name: 'documentation[plansAndDrawings]', maxCount: 10 },
    { name: 'documentation[reports]', maxCount: 10 },
    { name: 'documentation[correspondence]', maxCount: 10 },
    { name: 'documentation[safetyReports]', maxCount: 5 },
    { name: 'documentation[qualityReports]', maxCount: 5 },
    { name: 'documentation[progressReports]', maxCount: 10 },
    { name: 'documentation[financialReports]', maxCount: 5 },
    { name: 'documentation[environmentalReports]', maxCount: 5 },
    { name: 'documentation[changeOrders]', maxCount: 10 },
    { name: 'documentation[submittals]', maxCount: 10 },
    { name: 'documentation[inspectionReports]', maxCount: 10 },
    { name: 'documentation[meetingMinutes]', maxCount: 20 },
    { name: 'documentation[photos]', maxCount: 50 },
    { name: 'documentation[warranties]', maxCount: 5 },
    { name: 'documentation[asBuiltDrawings]', maxCount: 10 },
    { name: 'documentation[operationManuals]', maxCount: 5 },
    { name: 'documentation[certifications]', maxCount: 5 },
    { name: 'documentation[insuranceDocuments]', maxCount: 5 }
  ]),
  updateProjectConstruction
);
router.get(
  '/get-project',
  verifyToken,
  getConstructionProjects
);
router.delete(
  '/delete-contruct',
  verifyToken,
  deleteProjectConstruction
);
router.post(
  '/get-expense',
  verifyToken,
  getProjectExpenses
);
router.get(
  '/get-projectspecific',
  verifyToken,
  getProjectContruct
);
router.post(
  '/expense-dashboard',
  verifyToken,
  getProjectExpensesC
);
router.put(
  '/update-status',
  verifyToken,
  updateProjectStatus
);


module.exports = router;


