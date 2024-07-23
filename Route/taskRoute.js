const express = require('express');
const router = express.Router();

const {  updateTask,addTask,getTaskWithProgress,deleteTask } = require('../Controller/Task/addTask')
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.post('/add', verifyToken, addTask);                                                               //working
router.get('/get', verifyToken, getTaskWithProgress);                                                              //working
router.put('/update', verifyToken, updateTask);                                                            //working
router.delete('/delete', verifyToken, deleteTask);                                                            //working

module.exports = router;

