const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  ID: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000),
  },
  UserID: {
    type:String
  },
  SubscriptionMonth: {
    type: String,
  },
  Amount: {
    type: Number,
  },
  Currency: {
    type: String,
  },
  PaymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Stripe', 'Other'],
  },
  Status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending',
  },
  Date: {
    type: Date,
    default: Date.now,
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
