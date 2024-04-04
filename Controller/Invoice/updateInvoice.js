const Invoice = require('../../Model/Invoices');
const { uploadImageToFirebase } = require('../../Firebase/uploadImage');

const updateInvoice = async (req, res) => {
    try {
        const { invoiceId } = req.body;
        const adminId = req.adminId
;
        const {
            CustomerId,
            InvoiceDate,
            Quantity,
            Amount,
            Status,
            From,
            To,
            Items,
            SubTotal,
            Vat,
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

        invoice.CustomerId = CustomerId || invoice.CustomerId;
        invoice.InvoiceDate = InvoiceDate || invoice.InvoiceDate;
        invoice.Quantity = Quantity || invoice.Quantity;
        invoice.Amount = Amount || invoice.Amount;
        invoice.Status = Status || invoice.Status;
        invoice.From = From || invoice.From;
        invoice.To = To || invoice.To;
        invoice.Items = Items || invoice.Items;
        invoice.SubTotal = SubTotal || invoice.SubTotal;
        invoice.Vat = Vat || invoice.Vat;
        invoice.InvoiceTotal = InvoiceTotal || invoice.InvoiceTotal;
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
