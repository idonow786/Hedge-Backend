const GaapSalesTarget = require('../../../../Model/Gaap/gaap_salestarget');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapDsr = require('../../../../Model/Gaap/gaap_dsr');
const GaapTeam = require('../../../../Model/Gaap/gaap_team');
const { UserTimelineV1Paginator } = require('twitter-api-v2');

// Add Sales Target
const addSalesTarget = async (req, res) => {
    try {
        const { targetType, startDate, endDate, targetDetails } = req.body;

        if (!targetType || !startDate || !endDate || !targetDetails) {
            return res.status(400).json({ message: 'Target type, start date, end date, and target details are required' });
        }

        if (targetType === 'Daily' && !targetDetails.officeVisits) {
            return res.status(400).json({ message: 'Office visits target is required for daily targets' });
        }

        if (['Monthly', 'Quarterly', 'Yearly'].includes(targetType) && !targetDetails.closings) {
            return res.status(400).json({ message: 'Closings target is required for monthly, quarterly, and yearly targets' });
        }

        const newTarget = new GaapSalesTarget({
            targetType,
            targetPeriod: { startDate, endDate },
            targetDetails,
            
            createdBy: req.adminId
        });

        await newTarget.save();
        res.status(201).json({ message: 'Sales target added successfully', target: newTarget });
    } catch (error) {
        console.error('Error adding sales target:', error);
        res.status(500).json({ message: 'Server error while adding sales target' });
    }
};

const getManagedUsersData = async (req, res) => {
  try {
    const adminId = req.adminId;
    const userRole = req.role;
    let dsrs = [];
    let managedUsers = [];
    let userIds = [];
    let salesTargets = [];

    if (userRole === 'admin' || userRole === 'General Manager') {
      managedUsers = await GaapUser.find({}).lean();
    } else {
      // Find teams where the current user is a manager
      const teams = await GaapTeam.find({ 'members.managerId': adminId }).lean();
      
      // Extract member IDs from the teams
      const memberIds = teams.flatMap(team => 
        team.members.filter(member => member.managerId === adminId)
          .map(member => member.memberId)
      );
      console.log("members ", memberIds);

      // Fetch user details for these members
      managedUsers = await GaapUser.find({ 
        $or: [
          { _id: { $in: memberIds } },
          { _id: adminId } // Include the admin themselves
        ]
      }).lean();
    }

    userIds = managedUsers.map(user => user._id);

    // Fetch DSRs
    if (userIds.length) {
      dsrs = await GaapDsr.find({ user: { $in: userIds } })
        .populate('user', 'fullName email role')
        .lean();
    }

    // Fetch Sales Targets
    if (userRole === 'admin' || userRole === 'General Manager') {
      salesTargets = await GaapSalesTarget.find().lean();
    } else {
      salesTargets = await GaapSalesTarget.find({ 
        $or: [
          { createdBy: adminId },
          { assignedTo: { $in: userIds } }
        ]
      }).lean();
    }

    // Fetch all user names for the sales targets
    const allUserIds = [...new Set([...userIds, ...salesTargets.map(target => target.assignedTo)])];
    const allUsers = await GaapUser.find({ _id: { $in: allUserIds } }, 'fullName email').lean();
    console.log(allUsers)
    // Create a map of user IDs to names
    const userMap = allUsers.reduce((acc, user) => {
      acc[user._id.toString()] = user.fullName || user.email;
      return acc;
    }, {});
    console.log(userMap)

    // Add staff names to sales targets
    salesTargets = salesTargets.map(target => ({
      ...target,
      staff: allUsers
    }));

    // Prepare the response
    const response = {
      users: managedUsers,
      dsrs,
      salesTargets,
    };

    res.status(200).json({ message: 'Data fetched successfully', data: response });
  } catch (error) {
    console.error('Error fetching managed users data:', error);
    res.status(500).json({ message: 'Server error while fetching data' });
  }
};


// Update Sales Target
const updateSalesTarget = async (req, res) => {
    try {
        const { targetId, targetType, startDate, endDate, targetDetails } = req.body;

        if (!targetId) {
            return res.status(400).json({ message: 'Target ID is required' });
        }

        const updateData = {
            targetType,
            targetPeriod: { startDate, endDate },
            targetDetails,
            updatedAt: Date.now()
        };

        const updatedTarget = await GaapSalesTarget.findByIdAndUpdate(
            targetId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTarget) {
            return res.status(404).json({ message: 'Sales target not found' });
        }

        res.status(200).json({ message: 'Sales target updated successfully', target: updatedTarget });
    } catch (error) {
        console.error('Error updating sales target:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid update data', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while updating sales target' });
    }
};

// Delete Sales Target
const deleteSalesTarget = async (req, res) => {
    try {
        const { targetId } = req.body;

        if (!targetId) {
            return res.status(400).json({ message: 'Target ID is required' });
        }

        const deletedTarget = await GaapSalesTarget.findByIdAndDelete(targetId);

        if (!deletedTarget) {
            return res.status(404).json({ message: 'Sales target not found' });
        }

        res.status(200).json({ message: 'Sales target deleted successfully' });
    } catch (error) {
        console.error('Error deleting sales target:', error);
        res.status(500).json({ message: 'Server error while deleting sales target' });
    }
};

module.exports = {
    addSalesTarget,
    getManagedUsersData,
    updateSalesTarget,
    deleteSalesTarget
};
