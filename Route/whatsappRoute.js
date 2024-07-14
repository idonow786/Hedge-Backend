const express = require('express');
const { updateToken,getToken } = require('../Controller/Social/Whatsappthird/TokenController');
const { sendMessage, upload } = require('../Controller/Social/Whatsappthird/sendMessage');
const { getAllMessages } = require('../Controller/Social/Whatsappthird/allMessages');
const { sending,QRcode } = require('../Controller/Social/Whatsappthird/send');
const { verifyToken } = require('../Middleware/jwt');

const router = express.Router();

router.get('/get-token',verifyToken, getToken);
router.post('/add-token',verifyToken, updateToken);
router.post('/send-message', upload.single('file'),verifyToken, sendMessage);
router.get('/messages',verifyToken, getAllMessages);
router.post('/sending', upload.single('file'),verifyToken, sending);
router.get('/qr',verifyToken, QRcode);
router.get('/inbox',verifyToken, getAllMessages);

module.exports = router;
