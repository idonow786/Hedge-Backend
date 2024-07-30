const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  ID: {
    type: Number,
    default: () => Math.floor(Math.random() * 1000000),
  },
  UserID: {
    type: String,
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
  SubscriptionStatus: {
    type: String,
    enum: ['Pause', 'Cancel', 'Running'],
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
  Features: {
    Expense: {
      type: Boolean,
      default: false,
    },
    Projects: {
      type: Boolean,
      default: false,
    },
    Customers: {
      type: Boolean,
      default: false,
    },
    Staff: {
      type: Boolean,
      default: false,
    },
    SocialMedia: {
      type: Boolean,
      default: false,
    },
    Whatsapp: {
      type: Boolean,
      default: false,
    },
  },
  TotalStaff: {
    type: Number,
    default: 0,
  },
  TotalExpenses: {
    type: Number,
    default: 0,
  },
  TotalCustomers: {
    type: Number,
    default: 0,
  },
  TotalSocialMediaPosts: {
    type: Number,
    default: 0,
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

