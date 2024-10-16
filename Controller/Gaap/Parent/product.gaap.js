// productController.js
const FixedPriceProduct = require('../../../Model/Gaap/gaap_fixed_price_product');
const VariablePriceProduct = require('../../../Model/Gaap/gaap_variable_price_product');

const productController = {
  saveAllProducts: async (req, res) => {
    try {
      // Fixed Price Products data
      const fixedPriceData = [
        { 
          auditType: 'External Audit', 
          data: [
            { turnover: '0 - 3 million', amount: 3000, timeDeadline: '10 days' },
            { turnover: '3 - 5 million', amount: 3250, timeDeadline: '10 days' },
            { turnover: '5 - 10 million', amount: 4000, timeDeadline: '10 days' },
            { turnover: '10 - 15 million', amount: 4500, timeDeadline: '10 days' },
            { turnover: '15 - 20 million', amount: 5000, timeDeadline: '10 days' },
            { turnover: '20 - 25 million', amount: 5500, timeDeadline: '10 days' },
            { turnover: '25 - 30 million', amount: 6000, timeDeadline: '10 days' },
            { turnover: '30 - 35 million', amount: 6500, timeDeadline: '10 days' },
            { turnover: '35 - 45 million', amount: 7000, timeDeadline: '10 days' },
            { turnover: '45 - 50 million', amount: 7500, timeDeadline: '10 days' },
            { turnover: '50 - 60 million', amount: 8000, timeDeadline: '10 days' },
            { turnover: '60 - 70 million', amount: 8500, timeDeadline: '10 days' },
            { turnover: '70 - 80 million', amount: 9000, timeDeadline: '10 days' },
            { turnover: '80 - 90 million', amount: 9500, timeDeadline: '10 days' },
            { turnover: '90 - 95 million', amount: 10000, timeDeadline: '10 days' },
            { turnover: '95 - 100 million', amount: 10500, timeDeadline: '10 days' },
            { turnover: '100 - 105 million', amount: 11000, timeDeadline: '10 days' },
            { turnover: '105 - 110 million', amount: 11500, timeDeadline: '10 days' },
            { turnover: '110 - 115 million', amount: 12000, timeDeadline: '10 days' },
            { turnover: '115 - 120 million', amount: 12500, timeDeadline: '10 days' },
            { turnover: '120 - 125 million', amount: 13000, timeDeadline: '10 days' },
            { turnover: '125 - 135 million', amount: 13500, timeDeadline: '10 days' },
            { turnover: '135 - 150 million', amount: 14000, timeDeadline: '10 days' },
            { turnover: '150 million- Above', amount: 0, timeDeadline: 'Approval' }
          ]
        },
        { 
          auditType: 'ICV', 
          data: [
            { turnover: '0 - 3 million', amount: 3500, timeDeadline: '12 days' },
            { turnover: '3 - 5 million', amount: 4000, timeDeadline: '12 days' },
            { turnover: '5 - 10 million', amount: 4500, timeDeadline: '12 days' },
            { turnover: '10 - 15 million', amount: 5000, timeDeadline: '12 days' },
            { turnover: '15 - 20 million', amount: 5500, timeDeadline: '12 days' },
            { turnover: '20 - 25 million', amount: 6000, timeDeadline: '12 days' },
            { turnover: '25 - 30 million', amount: 6500, timeDeadline: '12 days' },
            { turnover: '30 - 35 million', amount: 7000, timeDeadline: '12 days' },
            { turnover: '35 - 45 million', amount: 7500, timeDeadline: '12 days' },
            { turnover: '45 - 50 million', amount: 8000, timeDeadline: '12 days' },
            { turnover: '50 - 60 million', amount: 8500, timeDeadline: '12 days' },
            { turnover: '60 - 70 million', amount: 9000, timeDeadline: '12 days' },
            { turnover: '70 - 80 million', amount: 9500, timeDeadline: '12 days' },
            { turnover: '80 - 90 million', amount: 10000, timeDeadline: '12 days' },
            { turnover: '90 - 95 million', amount: 10500, timeDeadline: '12 days' },
            { turnover: '95 - 100 million', amount: 11000, timeDeadline: '12 days' },
            { turnover: '100 - 105 million', amount: 11500, timeDeadline: '12 days' },
            { turnover: '105 - 110 million', amount: 12000, timeDeadline: '12 days' },
            { turnover: '110 - 115 million', amount: 12500, timeDeadline: '12 days' },
            { turnover: '115 - 120 million', amount: 13000, timeDeadline: '12 days' },
            { turnover: '120 - 125 million', amount: 13500, timeDeadline: '12 days' },
            { turnover: '125 - 135 million', amount: 14000, timeDeadline: '12 days' },
            { turnover: '135 - 150 million', amount: 14500, timeDeadline: '12 days' },
            { turnover: '150 million- Above', amount: 0, timeDeadline: 'Approval' }
          ]
        },
        { 
          auditType: 'ICV+external Audit', 
          data: [
            { turnover: '0 - 3 million', amount: 6000, timeDeadline: '20 days' },
            { turnover: '3 - 5 million', amount: 6500, timeDeadline: '20 days' },
            { turnover: '5 - 10 million', amount: 7750, timeDeadline: '20 days' },
            { turnover: '10 - 15 million', amount: 8750, timeDeadline: '20 days' },
            { turnover: '15 - 20 million', amount: 9750, timeDeadline: '20 days' },
            { turnover: '20 - 25 million', amount: 10500, timeDeadline: '20 days' },
            { turnover: '25 - 30 million', amount: 11500, timeDeadline: '20 days' },
            { turnover: '30 - 35 million', amount: 12500, timeDeadline: '20 days' },
            { turnover: '35 - 45 million', amount: 13500, timeDeadline: '20 days' },
            { turnover: '45 - 50 million', amount: 14500, timeDeadline: '20 days' },
            { turnover: '50 - 60 million', amount: 15000, timeDeadline: '20 days' },
            { turnover: '60 - 70 million', amount: 16000, timeDeadline: '20 days' },
            { turnover: '70 - 80 million', amount: 17000, timeDeadline: '20 days' },
            { turnover: '80 - 90 million', amount: 18000, timeDeadline: '20 days' },
            { turnover: '90 - 95 million', amount: 19000, timeDeadline: '20 days' },
            { turnover: '95 - 100 million', amount: 20000, timeDeadline: '20 days' },
            { turnover: '100 - 105 million', amount: 20500, timeDeadline: '20 days' },
            { turnover: '105 - 110 million', amount: 21500, timeDeadline: '20 days' },
            { turnover: '110 - 115 million', amount: 22500, timeDeadline: '20 days' },
            { turnover: '115 - 120 million', amount: 23500, timeDeadline: '20 days' },
            { turnover: '120 - 125 million', amount: 24500, timeDeadline: '20 days' },
            { turnover: '125 - 135 million', amount: 25500, timeDeadline: '20 days' },
            { turnover: '135 - 150 million', amount: 26500, timeDeadline: '20 days' },
            { turnover: '150 million- Above', amount: 0, timeDeadline: 'Approval' }
          ]
        }
      ];

      // Variable Price Products data
      const variablePriceData = [
        // { 
        //   category: 'Audit & Assurance',
        //   subCategories: [
        //     { name: 'internal audit', department: 'audit' },
        //     { name: 'tax audit', department: 'audit' },
        //     { name: 'audit review', department: 'audit' },
        //     { name: 'cost audit', department: 'audit' },
        //     { name: 'stock audit', department: 'audit' },
        //     { name: 'interim audit', department: 'audit' },
        //     { name: 'stock audit', department: 'audit' },
        //     { name: 'other audit', department: 'audit' }
        //   ]
        // },
        // { 
        //   category: 'Book keeping',
        //   subCategories: [
        //     { name: 'accounting & supervisory services', department: 'accounts manager' },
        //     { name: 'accounting and VAT', department: 'accounts manager' },
        //     { name: 'accounting and auditing', department: 'accounts manager' },
        //     { name: 'others', department: 'accounts manager' }
        //   ]
        // },
        {
          category: 'Registration & Filing',
          subCategories: [
            // { name: 'VAT filing', department: 'compliance manager' },
            // { name: 'corporate TAX registration', department: 'compliance manager' },
            // { name: 'corporate TAX registration filing', department: 'compliance manager' },
            // { name: 'VAT filing', department: 'compliance manager' },
            // { name: 'AONC registration', department: 'compliance manager' },
            // { name: 'vendor Registration', department: 'compliance manager' },
            // { name: 'VAT account amendment', department: 'compliance manager' },
            // { name: 'Business setup', department: 'compliance manager' },
            // { name: 'VAT Registration', department: 'compliance manager' },
            // { name: 'ESR Registration', department: 'compliance manager' },
            // { name: 'ESR Filing', department: 'compliance manager' },
            // { name: 'FIU registration & Filing', department: 'compliance manager' },
            { name: 'GoAML registration & Filing', department: 'compliance manager' },
          ]
        }
        // {
        //   category: 'Taxation',
        //   subCategories: [
        //     { name: 'TRN cancelation/deregistration', department: 'compliance manager' },
        //     { name: 'VAT refund services', department: 'compliance manager' },
        //     { name: 'TAX assessment', department: 'compliance manager' },
        //     { name: 'trade license amendment', department: 'compliance manager' },
        //     { name: 'penalty waiver', department: 'compliance manager' },
        //     { name: 'TAX group amendment and registration', department: 'compliance manager' },
        //     { name: 'TRN transfer', department: 'compliance manager' },
        //     { name: 'other', department: 'compliance manager' }
        //   ]
        // },
        // {
        //   category: 'Compliance',
        //   subCategories: [
        //     { name: 'ISO KML', department: 'audit' },
        //     { name: 'liquidation', department: 'audit' },
        //     { name: 'other consultancy', department: 'audit' },
        //     { name: 'liability reports', department: 'audit' },
        //     { name: 'business valuation', department: 'audit' },
        //     { name: 'others', department: 'audit' }
        //   ]
        // }
      ];

      // // Save Fixed Price Products
      // for (const auditTypeData of fixedPriceData) {
      //   for (const product of auditTypeData.data) {
      //     await FixedPriceProduct.create({
      //       adminId:req.adminId,
      //       auditType: auditTypeData.auditType,
      //       turnover: product.turnover,
      //       amount: product.amount,
      //       timeDeadline: product.timeDeadline
      //     });
      //   }
      // }

      // Save Variable Price Products
      for (const categoryData of variablePriceData) {
        for (const subCategory of categoryData.subCategories) {
          await VariablePriceProduct.create({
            adminId:req.adminId,
            category: categoryData.category,
            subCategory: subCategory.name,
            department: subCategory.department
          });
        }
      }

      res.status(200).json({ message: 'All products saved successfully' });
    } catch (error) {
      console.error('Error saving products:', error);
      res.status(500).json({ error: 'An error occurred while saving products' });
    }
  },

  getAllFixedPriceProducts: async (req, res) => {
    try {
      const products = await FixedPriceProduct.find();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching fixed price products' });
    }
  },

  getAllVariablePriceProducts: async (req, res) => {
    try {
      const products = await VariablePriceProduct.find();
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching variable price products' });
    }
  }
};







module.exports = productController;


  //   try {
  //     // Find all documents
  //     const products = await FixedPriceProduct.find({});

  //     // Array to store update operations
  //     const bulkOps = [];

  //     for (const product of products) {
  //         let updateNeeded = false;
  //         const updateObj = {};

  //         if (product.auditType === 'R.Y') {
  //             updateObj.auditType = 'ICV';
  //             updateNeeded = true;
  //         } else if (product.auditType === 'R.Y+external Audit') {
  //             updateObj.auditType = 'ICV+external Audit';
  //             updateNeeded = true;
  //         }

  //         if (updateNeeded) {
  //             bulkOps.push({
  //                 updateOne: {
  //                     filter: { _id: product._id },
  //                     update: { $set: updateObj }
  //                 }
  //             });
  //         }
  //     }

  //     // Perform bulk update if there are operations
  //     if (bulkOps.length > 0) {
  //         await FixedPriceProduct.bulkWrite(bulkOps);
  //         res.status(200).json({
  //             message: `Successfully updated ${bulkOps.length} documents`,
  //             updatedCount: bulkOps.length
  //         });
  //     } else {
  //         res.status(200).json({
  //             message: "No documents needed updating",
  //             updatedCount: 0
  //         });
  //     }

  // } catch (error) {
  //     console.error('Error updating audit types:', error);
  //     res.status(500).json({
  //         message: 'Error updating audit types',
  //         error: error.message
  //     });
  // }