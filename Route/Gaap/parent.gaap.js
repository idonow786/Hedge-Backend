const express = require('express');
const router = express.Router();

const { registerUser} = require('../../Controller/Gaap/Parent/register.gaap')
const { updateUser} = require('../../Controller/Gaap/Parent/update.gaap')
const { deleteUser} = require('../../Controller/Gaap/Parent/delete.gaap')

const { verifyToken } = require('../../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});



router.post('/add-users',verifyToken, registerUser);                                          //
router.put('/update-users',verifyToken, updateUser);                                          //
router.delete('/delete-users', verifyToken, deleteUser);                                      //






module.exports = router;

