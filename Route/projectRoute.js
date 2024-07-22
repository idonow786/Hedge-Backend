const express = require('express');
const router = express.Router();
const { addProject } = require('../Controller/Project/addProject')
const { deleteProject } = require('../Controller/Project/deleteProject')
const { getProjects,getProjectsByCustomerId } = require('../Controller/Project/getProject')
const { updateProject } = require('../Controller/Project/updateProject')


const { addProjectConstruction } = require('../Controller/Project/addProjectConstruction')
const { updateProjectContruction } = require('../Controller/Project/updateProjectContruction')


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
    { name: 'documentation[plansAndDrawings]', maxCount: 5 },
    { name: 'documentation[reports]', maxCount: 5 },
    { name: 'documentation[correspondence]', maxCount: 5 },
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
    { name: 'documentation[plansAndDrawings]', maxCount: 5 },
    { name: 'documentation[reports]', maxCount: 5 },
    { name: 'documentation[correspondence]', maxCount: 5 },
  ]),
  updateProjectContruction
);

module.exports = router;


