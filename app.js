const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');


dotenv.config();

const app = express();




//    Routes Importing
const adminRoute=require('./Route/adminRoute') 
const customerRoute=require('./Route/customerRoute') 
const expenseRoute=require('./Route/expenseRoute') 
const staffRoute=require('./Route/staffRoute') 



// Connect to MongoDB
const db = require('./Config/db');

// Middleware
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('combined'));

// Routes
app.get('/', (req, res) => {
  res.send('Hello, world!');
});




//Routes
app.use('/api/admin',adminRoute)
app.use('/api/customer',customerRoute)
app.use('/api/expense',expenseRoute)
app.use('/api/staff',staffRoute)


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
