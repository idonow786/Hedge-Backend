const Payment = require('../../Model/Payment');

const addPayment = async (req, res) => {
  try {
    const { 
      UserID, 
      SubscriptionMonth, 
      Amount, 
      Currency, 
      PaymentMethod, 
      Features, 
      TotalStaff, 
      TotalExpenses, 
      TotalCustomers, 
      TotalSocialMediaPosts,
      SubscriptionStatus 
    } = req.body;

    if (req.role !== 'superadmin') {
      return res.status(400).json({ message: 'You are not Super Admin' });
    }

    const defaultFeatures = {
      Expense: false,
      Projects: false,
      Customers: false,
      Staff: false,
      SocialMedia: false,
      Whatsapp: false
    };

    const mergedFeatures = Features ? {
      ...defaultFeatures,
      ...Object.fromEntries(
        Object.entries(Features)
          .filter(([key, value]) => value !== undefined)
      )
    } : defaultFeatures;

    const newPayment = new Payment({
      UserID,
      SubscriptionMonth,
      Amount,
      Currency,
      PaymentMethod,
      Features: mergedFeatures,
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

    const { 
      paymentId, 
      SubscriptionMonth, 
      Amount, 
      Currency, 
      PaymentMethod, 
      Status, 
      Features, 
      TotalStaff, 
      TotalExpenses, 
      TotalCustomers, 
      TotalSocialMediaPosts,
      SubscriptionStatus 
    } = req.body;

    const existingPayment = await Payment.findById(paymentId);
    if (!existingPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const updateFields = {
      ...(SubscriptionMonth !== undefined && { SubscriptionMonth }),
      ...(Amount !== undefined && { Amount }),
      ...(Currency !== undefined && { Currency }),
      ...(PaymentMethod !== undefined && { PaymentMethod }),
      ...(Status !== undefined && { Status }),
      ...(SubscriptionStatus !== undefined && { SubscriptionStatus }),
      ...(TotalStaff !== undefined && { TotalStaff }),
      ...(TotalExpenses !== undefined && { TotalExpenses }),
      ...(TotalCustomers !== undefined && { TotalCustomers }),
      ...(TotalSocialMediaPosts !== undefined && { TotalSocialMediaPosts }),
    };

    if (Features !== undefined) {
      updateFields.Features = {
        ...existingPayment.Features,
        ...(Features.Expense !== undefined && { Expense: Features.Expense }),
        ...(Features.Projects !== undefined && { Projects: Features.Projects }),
        ...(Features.Customers !== undefined && { Customers: Features.Customers }),
        ...(Features.Staff !== undefined && { Staff: Features.Staff }),
        ...(Features.SocialMedia !== undefined && { SocialMedia: Features.SocialMedia }),
        ...(Features.Whatsapp !== undefined && { Whatsapp: Features.Whatsapp }),
      };
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      paymentId,
      updateFields,
      { new: true, runValidators: true }
    );

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
