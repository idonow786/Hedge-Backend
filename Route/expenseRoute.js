const express = require('express');
const router = express.Router();
const {addExpense} = require('../Controller/Expense/addExpense');
const {deleteExpense} = require('../Controller/Expense/deleteExpense');
const {getExpenses} = require('../Controller/Expense/getExpense');
const {updateExpense} = require('../Controller/Expense/updateExpense');
const {verifyToken} = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, 
    },
  });
  
router.post('/expense',verifyToken, addExpense);                                                                 //no test
router.delete('/expense/remove',verifyToken, deleteExpense);                                                             //no test
router.get('/expenses',verifyToken, getExpenses);                                                              //no test
router.put('/expense/update', verifyToken, updateExpense);                                                    //no test
 
module.exports = router;
