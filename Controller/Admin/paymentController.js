const Payment = require('../../Model/Payment');

const addPayment = async (req, res) => {
  try {
    const { UserID, SubscriptionMonth, Amount, Currency, PaymentMethod, Features, TotalStaff, TotalExpenses, TotalCustomers, TotalSocialMediaPosts,
      SubscriptionStatus } = req.body;

    if (req.role !== 'superadmin') {
      return res.status(400).json({ message: 'You are not Super Admin' });
    }

    const newPayment = new Payment({
      UserID,
      SubscriptionMonth,
      Amount,
      Currency,
      PaymentMethod,
      Features: {
        Expense: Features?.Expense ?? false,
        Projects: Features?.Projects ?? false,
        Customers: Features?.Customers ?? false,
        Staff: Features?.Staff ?? false,
        SocialMedia: Features?.SocialMedia ?? false,
        Whatsapp: Features?.Whatsapp ?? false,
      },
      SubscriptionStatus,
      TotalStaff: TotalStaff ?? 0,
      TotalExpenses: TotalExpenses ?? 0,
      TotalCustomers: TotalCustomers ?? 0,
      TotalSocialMediaPosts: TotalSocialMediaPosts ?? 0,
    });

    const savedPayment = await newPayment.save();

    res.status(201).json({ message: 'Payment added successfully', payment: savedPayment });
  } catch (error) {
    console.error('Error adding payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



const updatePayment = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
      return res.status(400).json({ message: 'You are not Super Admin' });
    }

    const { paymentId, SubscriptionMonth, Amount, Currency, PaymentMethod, Status, Features, TotalStaff, TotalExpenses, TotalCustomers, TotalSocialMediaPosts,SubscriptionStatus } = req.body;

    const updateFields = {};
    if (SubscriptionMonth !== undefined) updateFields.SubscriptionMonth = SubscriptionMonth;
    if (Amount !== undefined) updateFields.Amount = Amount;
    if (Currency !== undefined) updateFields.Currency = Currency;
    if (PaymentMethod !== undefined) updateFields.PaymentMethod = PaymentMethod;
    if (Status !== undefined) updateFields.Status = Status;
    if (SubscriptionStatus !== undefined) updateFields.SubscriptionStatus = SubscriptionStatus;

    if (Features !== undefined) {
      updateFields.Features = {
        Expense: Features.Expense ?? false,
        Projects: Features.Projects ?? false,
        Customers: Features.Customers ?? false,
        Staff: Features.Staff ?? false,
        SocialMedia: Features.SocialMedia ?? false,
        Whatsapp: Features?.Whatsapp ?? false,
      };
    }

    if (TotalStaff !== undefined) updateFields.TotalStaff = TotalStaff;
    if (TotalExpenses !== undefined) updateFields.TotalExpenses = TotalExpenses;
    if (TotalCustomers !== undefined) updateFields.TotalCustomers = TotalCustomers;
    if (TotalSocialMediaPosts !== undefined) updateFields.TotalSocialMediaPosts = TotalSocialMediaPosts;

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      updateFields,
      { new: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment updated successfully', payment: updatedPayment });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};




const deletePayment = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
        return res.status(400).json({ message: 'You are not Super Admin' });
      }
    const { paymentId } = req.body;

    const deletedPayment = await Payment.findByIdAndDelete(paymentId);

    if (!deletedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



const getPayments = async (req, res) => {
  try {
    if (req.role !== 'superadmin') {
        return res.status(400).json({ message: 'You are not Super Admin' });
      }
    const { userId } = req.body;
    let payments
    if (userId) {
         payments = await Payment.find({ UserID: userId });
        }else{
        payments = await Payment.find();

    }

    if (payments.length === 0) {
      return res.status(404).json({ message: 'No payments found for the user' });
    }

    res.status(200).json({ payments });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { deletePayment,updatePayment,addPayment ,getPayments};
