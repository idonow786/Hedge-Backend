const express = require('express');
const { updateToken,getToken } = require('../Controller/Social/Whatsappthird/TokenController');
const { sendMessage, upload } = require('../Controller/Social/Whatsappthird/sendMessage');
const { getAllMessages } = require('../Controller/Social/Whatsappthird/allMessages');
const { getReport,getMessages } = require('../Controller/Social/Whatsappthird/getReport');
const whatsappController = require('../Controller/Social/Whatsappthird/send');
// const sessionController = require('../Controller/Social/Whatsappthird/sessionController');
const { verifyToken } = require('../Middleware/jwt');

const router = express.Router();

router.get('/get-token',verifyToken, getToken);
router.post('/add-token',verifyToken, updateToken);
router.post('/send-message', upload.single('file'),verifyToken, sendMessage);
router.get('/messages',verifyToken, getAllMessages);






//venom
router.get('/inbox',verifyToken, getMessages);
router.get('/report',verifyToken, getReport);
router.post('/send-messages', upload.single('file'),verifyToken, whatsappController.processAndSendMessages);
// router.post('/removeSession',verifyToken, sessionController.removeSession);


module.exports = router;
