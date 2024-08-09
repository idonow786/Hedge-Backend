const GaapSalesTarget = require('../../../../Model/Gaap/gaap_salestarget');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const GaapDsr = require('../../../../Model/Gaap/gaap_dsr');

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

// Get Sales Targets and DSRs
const getManagedUsersData = async (req, res) => {
    try {
        const adminId = req.adminId; 
        let dsrs = null;
        const managedUsers = await GaapUser.find({ createdBy: adminId });

        if (managedUsers.length) {
            const userIds = managedUsers.map(user => user._id);
            dsrs = await GaapDsr.find({ user: { $in: userIds } }).populate('user', 'fullName');
        }

        const salesTargets = await GaapSalesTarget.find({ 
            $or: [
                { createdBy: adminId },
                { assignedTo: { $in: [adminId, ...managedUsers.map(user => user._id)] } }
            ]
        }).populate('assignedTo', 'fullName');

        const response = {
            dsrs,
            salesTargets
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
