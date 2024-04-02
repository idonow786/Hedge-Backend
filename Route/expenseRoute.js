const express = require('express');
const router = express.Router();
const { addExpense } = require('../Controller/Expense/addExpense');
const { deleteExpense } = require('../Controller/Expense/deleteExpense');
const { getExpenses } = require('../Controller/Expense/getExpense');
const { updateExpense } = require('../Controller/Expense/updateExpense');
const { verifyToken } = require('../Middleware/jwt');
const multer = require('multer');




const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

router.post('/add', verifyToken, addExpense);                                                              //working
router.delete('/remove', verifyToken, deleteExpense);                                                  //working
router.get('/get', verifyToken, getExpenses);                                                             //working
router.put('/update', verifyToken, updateExpense);                                                    //working

module.exports = router;
