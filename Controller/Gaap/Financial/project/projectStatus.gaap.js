const GaapProject = require('../../../../Model/Gaap/gaap_project');
const ProjectPayment = require('../../../../Model/Gaap/gaap_projectPayment');
const GaapComment = require('../../../../Model/Gaap/gaap_comment');
const GaapNotification = require('../../../../Model/Gaap/gaap_notification');
const mongoose = require('mongoose');

const quotationController = {
    // View Quotation
    viewQuotation: async (req, res) => {
        try {
            const { projectId } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Invalid Project ID format' });
            }

            const project = await GaapProject.findById(projectId)
                .populate('customer')
                .populate('assignedTo', 'name')
                .populate('salesPerson', 'name')
                .populate('products.product', 'name');

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            res.status(200).json({ project });
        } catch (error) {
            console.error('Error viewing quotation:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },

    // Approve Quotation
    approveQuotation: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { projectId, amount, comment } = req.body;
            const userId = req.adminId;

            if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Valid Project ID is required' });
            }

            const project = await GaapProject.findById(projectId).session(session);

            if (!project) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: 'Project not found' });
            }

            if (project.financialApproval) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: 'Project has already been financially approved' });
            }

            // Update project
            project.financialApproval = true;
            project.status = 'Approved';
            project.lastUpdatedBy = userId;

            if (amount) {
                if (isNaN(amount) || amount <= 0) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: 'Invalid amount provided' });
                }

                // Update payment
                const payment = await ProjectPayment.findOne({ project: projectId }).session(session);
                if (!payment) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(404).json({ message: 'Project payment not found' });
                }

                payment.approvalAmount = Number(amount);
                // payment.unpaidAmount = payment.totalAmount - payment.paidAmount;
                payment.lastPaymentDate = new Date();
                payment.lastUpdatedBy = userId;

                payment.paymentHistory.push({
                    amount: Number(amount),
                    date: new Date(),
                    paymentMethod: 'Other',
                    receivedBy: userId,
                    notes: 'Payment received during quotation approval'
                });

                payment.updatePaymentStatus();

                await payment.save({ session });
            }

            // Add comment if provided
            if (comment) {
                const newComment = new GaapComment({
                    project: projectId,
                    user: userId,
                    content: comment,
                    type: 'comment',
                    teamId: project.teamId
                });
                await newComment.save({ session });
            }

            await project.save({ session });

            // Create notification for project creator
            const notification = new GaapNotification({
                user: project.createdBy,
                message: `Your project "${project.projectName}" has been approved.`,
                isRead: false
            });
            await notification.save({ session });

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({
                message: 'Quotation approved successfully',
                financialApproval: true,
                paymentReceived: amount ? true : false
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error('Error approving quotation:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }
};

module.exports = quotationController;
