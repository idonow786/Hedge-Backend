const mongoose = require('mongoose');

const SubcategoryExpenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  }
});

const ProjectExpenseSchema = new mongoose.Schema({
  projectId: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  subcategories: [SubcategoryExpenseSchema],
  date: {
    type: Date,
    default: Date.now
  },
  paidBy: {
    type: String,
    required: true
  },
  receipt: {
    type: String, 
    default: null
  },
  notes: {
    type: String,
    trim: true
  },
  isReimbursed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true 
});

ProjectExpenseSchema.index({ projectId: 1, date: -1 });

ProjectExpenseSchema.virtual('calculatedTotalAmount').get(function() {
  return this.subcategories.reduce((total, subcategory) => total + subcategory.amount, 0);
});

ProjectExpenseSchema.pre('save', function(next) {
  this.totalAmount = this.subcategories.reduce((total, subcategory) => total + subcategory.amount, 0);
  next();
});

const ProjectExpense = mongoose.model('ProjectExpense', ProjectExpenseSchema);

module.exports = ProjectExpense;