const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');

const deleteCustomer = async (req, res) => {
  try {
    // Check if the user's role is 'sales executive'
    console.log(req.role)
    if (req.role !== 'Sales Executive') {
      return res.status(403).json({ message: 'Access denied. Only sales executives can delete customers.' });
    }

    const { customerId } = req.body;

    // Validate customerId
    if (!customerId) {
      return res.status(400).json({ message: 'Customer ID is required' });
    }

    // Find and delete the customer
    const deletedCustomer = await GaapCustomer.findByIdAndDelete(customerId);

    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // If the customer had any associated files, you might want to delete them from storage here
    // This depends on how you've set up file storage (e.g., Firebase, local storage, etc.)
    // For example, if using Firebase:
    // if (deletedCustomer.documents && deletedCustomer.documents.length > 0) {
    //   for (const doc of deletedCustomer.documents) {
    //     if (doc.documentUrl) {
    //       const fileName = doc.documentUrl.split('/').pop().split('?')[0];
    //       await admin.storage().bucket().file(`documents/${fileName}`).delete().catch(console.error);
    //     }
    //   }
    // }

    res.status(200).json({ 
      message: 'Customer deleted successfully',
      deletedCustomer: deletedCustomer
    });

  } catch (error) {
    console.error('Error in deleteCustomer:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }

    res.status(500).json({ message: 'An error occurred while deleting the customer' });
  }
};
module.exports={deleteCustomer}