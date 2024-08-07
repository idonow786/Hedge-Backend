const GaapSalesTarget = require('../../../../Model/Gaap/gaap_salestarget');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

// Add Sales Target
const addSalesTarget = async (req, res) => {
    try {
        const {  targetType, targetValue } = req.body;

        if (!targetType || !targetValue) {
            return res.status(400).json({ message: ' target type, and target value are required' });
        }

        const newTarget = new GaapSalesTarget({
            user:req.adminId,
            targetType,
            targetValue
        });

        await newTarget.save();
        res.status(201).json({ message: 'Sales target added successfully', target: newTarget });
    } catch (error) {
        console.error('Error adding sales target:', error);
        res.status(500).json({ message: 'Server error while adding sales target' });
    }
};

// Get Sales Targets
const getManagedUsersData = async (req, res) => {
    try {
        const adminId = req.adminId; 

        const managedUsers = await GaapUser.find({ createdBy: adminId });

        if (!managedUsers.length) {
            return res.status(404).json({ message: 'No managed users found' });
        }

        const userIds = managedUsers.map(user => user._id);

        const dsrs = await GaapDsr.find({ user: { $in: userIds } }).populate('user', 'fullName');

        const salesTargets = await GaapSalesTarget.find({ user: req.adminId}).populate('user', 'fullName');

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
        const { targetId, ...updateData } = req.body; 

        if (!targetId) {
            return res.status(400).json({ message: 'Target ID is required' });
        }

        // Update the target using the provided data
        const updatedTarget = await GaapSalesTarget.findByIdAndUpdate(
            targetId,
            { ...updateData, updatedAt: Date.now() },
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
