const Invoice = require('../../Model/Invoices');
const Project = require('../../Model/Project');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const updateInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.body;
        const adminId = req.adminId;
        const {
            CustomerId,
            InvoiceDate,
            Quantity,
            Amount,
            Status,
            InvoiceNumber,
            SubTotal,
            Vat,
            ProjectId,
            InvoiceTotal,
            Description,
        } = req.body;

        if (!invoiceId) {
            return res.status(400).json({ message: 'Invoice ID is required' });
        }

        const invoice = await Invoice.findOne({ _id: invoiceId, AdminID: adminId });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found or not authorized' });
        }

        if (ProjectId) {
            const project = await Project.findOne({ _id: ProjectId, AdminID: adminId });
            if (!project) {
                return res.status(404).json({ message: 'Project not found or does not belong to the admin' });
            }
        }

        invoice.CustomerId = CustomerId || invoice.CustomerId;
        invoice.InvoiceDate = InvoiceDate || invoice.InvoiceDate;
        invoice.Quantity = Quantity !== undefined ? Quantity : invoice.Quantity;
        invoice.Amount = Amount !== undefined ? Amount : invoice.Amount;
        invoice.Status = Status || invoice.Status;
        invoice.InvoiceNumber = InvoiceNumber || invoice.InvoiceNumber;
        invoice.SubTotal = SubTotal !== undefined ? SubTotal : invoice.SubTotal;
        invoice.ProjectId = ProjectId !== undefined ? ProjectId : invoice.ProjectId;
        invoice.Vat = Vat !== undefined ? Vat : invoice.Vat;
        invoice.InvoiceTotal = InvoiceTotal !== undefined ? InvoiceTotal : invoice.InvoiceTotal;
        invoice.Description = Description || invoice.Description;

        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const contentType = req.file.mimetype;

            try {
                const PicUrl = await uploadImageToFirebase(base64Image, contentType);
                invoice.PicUrl = PicUrl;
            } catch (error) {
                console.error('Error uploading picture:', error);
                return res.status(500).json({ message: 'Failed to upload picture' });
            }
        }

        const updatedInvoice = await invoice.save();

        res.status(200).json({
            message: 'Invoice updated successfully',
            invoice: updatedInvoice,
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { updateInvoice };
