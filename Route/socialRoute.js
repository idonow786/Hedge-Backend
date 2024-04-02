const express = require('express');
const multer = require('multer');
const { getSocial,postSocial } = require('../Controller/Social');

const app = express();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/social/accounts',  getSocial);
app.post('/post-social', upload.single('image'), postSocial);

module.exports = router;
