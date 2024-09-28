const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../../Model/Gaap/gaap_user');
const csv = require('csv-parser');
const { Readable } = require('stream');

const registerCustomersFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const user = await GaapUser.findById(req.adminId);
    const results = [];
    const errors = [];

    // Create a readable stream from the buffer
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        for (const row of results) {
          try {
            const newCustomer = new GaapCustomer({
              companyName: row.companyName,
              landline: row.landline,
              mobile: row.mobile,
              trNumber: row.trNumber,
              industryType: row.industryType,
              address: {
                street: row.address_street,
                city: row.address_city,
                state: row.address_state,
                country: row.address_country,
                postalCode: row.address_postalCode,
              },
              contactPerson1: {
                name: row.contactPerson1_name,
                designation: row.contactPerson1_designation,
                email: row.contactPerson1_email,
                phoneNumber: row.contactPerson1_phoneNumber,
              },
              contactPerson2: {
                name: row.contactPerson2_name,
                designation: row.contactPerson2_designation,
                email: row.contactPerson2_email,
                phoneNumber: row.contactPerson2_phoneNumber,
              },
              teamId: user.teamId,
              registeredBy: req.adminId,
            });

            await newCustomer.save();
          } catch (error) {
            errors.push(`Error processing row for ${row.companyName}: ${error.message}`);
          }
        }

        if (errors.length > 0) {
          return res.status(207).json({
            message: 'Some customers were not registered due to errors',
            errors: errors,
          });
        }

        res.status(201).json({
          message: 'All customers registered successfully',
          customersCount: results.length,
        });
      });
  } catch (error) {
    console.error('Error in registerCustomersFromCSV:', error);
    res.status(500).json({ message: 'An error occurred while processing the CSV file' });
  }
};

module.exports = { registerCustomersFromCSV };
