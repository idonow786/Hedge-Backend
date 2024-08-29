const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

const getAllCustomersByAdmin = async (req, res) => {
  try {
    const { adminId, role } = req;
    let customers;
    if (role === 'admin' || role === 'Operation Manager') {
      // Find the team where the user is a parent
      const parentTeam = await GaapTeam.findOne({
        $or: [
          { 'parentUser.userId': req.adminId },
          { 'GeneralUser.userId': req.adminId },
          { 'members.managerId': req.adminId }
        ]
      });
      if (parentTeam) {
        // If user is a team parent, get all customers with matching teamId
        customers = await GaapCustomer.find({ teamId: parentTeam._id })
          .sort({ createdAt: -1 })
          .lean();
      }
    }
    else if (role === 'Finance Manager') {
      console.log(req.adminId)
      const user = await GaapUser.findById(adminId)
      console.log("user :",user)
      if(user){
        customers = await GaapCustomer.find({ teamId: user.teamId})
        .sort({ createdAt: -1 })
        .lean();
      }
    }
    else {

      // For other roles, check if the user is a manager in any team
      const managerTeam = await GaapTeam.findOne({ 'members.managerId': adminId });

      if (managerTeam) {
        // If user is a manager, get all customers registered by team members and the manager
        const teamMemberIds = managerTeam.members.map(member => member.memberId);
        teamMemberIds.push(adminId); // Include the manager's ID
        customers = await GaapCustomer.find({
          $or: [
            { registeredBy: { $in: teamMemberIds } },
            { registeredBy: adminId }
          ]
        })
          .sort({ createdAt: -1 })
          .lean();
      } else {
        // If user is neither a parent nor a manager, get customers registered by the user
        customers = await GaapCustomer.find({ registeredBy: adminId })
          .sort({ createdAt: -1 })
          .lean();
      }
    }

    res.status(200).json({
      message: 'Customers fetched successfully',
      customers: customers,
      totalCustomers: customers.length
    });

  } catch (error) {
    console.error('Error in getAllCustomersByAdmin:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid admin ID' });
    }

    res.status(500).json({ message: 'An error occurred while fetching customers' });
  }
};

module.exports = { getAllCustomersByAdmin };