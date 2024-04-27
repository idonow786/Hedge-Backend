const express = require('express');
const router = express.Router();
const { addProject } = require('../Controller/Project/addProject')
const { deleteProject } = require('../Controller/Project/deleteProject')
const { getProjects,getProjectsByCustomerId } = require('../Controller/Project/getProject')
const { updateProject } = require('../Controller/Project/updateProject')
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
router.get('/get', verifyToken,  getProjects);                                                                 //working
router.get('/get/projects/customer', verifyToken, getProjectsByCustomerId);                                                                 //working


module.exports = router;
