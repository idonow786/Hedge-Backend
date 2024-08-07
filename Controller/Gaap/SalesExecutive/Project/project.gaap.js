const GaapProject = require('../../../../Model/Gaap/gaap_project');
const GaapProduct = require('../../../../Model/Gaap/gaap_product');
const GaapCustomer = require('../../../../Model/Gaap/gaap_customer');
const GaapUser = require('../../../../Model/Gaap/gaap_user');

exports.createProject = async (req, res) => {
  try {
    const {
      projectName,
      customerId,
      projectType,
      department,
      assignedToId,
      salesPersonId,
      startDate,
      endDate,
      status,
      pricingType,
      totalAmount,
      appliedDiscount,
      discountApprovedById,
      products,
      vatDetails
    } = req.body;

    // Validate required fields
    if (!projectName || !customerId || !projectType || !department || !assignedToId || !salesPersonId || !startDate || !pricingType || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if customer exists
    const customer = await GaapCustomer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if assigned user and sales person exist
    const [assignedTo, salesPerson] = await Promise.all([
      GaapUser.findById(assignedToId),
      GaapUser.findById(salesPersonId)
    ]);
    if (!assignedTo || !salesPerson) {
      return res.status(404).json({ message: 'Assigned user or sales person not found' });
    }

    // Validate and process products
    const processedProducts = await Promise.all(products.map(async (product) => {
      const existingProduct = await GaapProduct.findById(product.productId);
      if (!existingProduct) {
        throw new Error(`Product with id ${product.productId} not found`);
      }
      return {
        product: existingProduct._id,
        quantity: product.quantity,
        price: product.price,
        turnoverRange: product.turnoverRange,
        timeDeadline: product.timeDeadline
      };
    }));

    const newProject = new GaapProject({
      projectName,
      customer: customerId,
      projectType,
      department,
      assignedTo: assignedToId,
      salesPerson: salesPersonId,
      startDate,
      endDate,
      status,
      pricingType,
      totalAmount,
      appliedDiscount,
      discountApprovedBy: discountApprovedById,
      products: processedProducts,
      vatDetails,
      createdBy: req.user._id // Assuming you have user authentication middleware
    });

    await newProject.save();
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await GaapProject.find()
      .populate('customer', 'name')
      .populate('assignedTo', 'name')
      .populate('salesPerson', 'name')
      .select('projectName customer projectType status startDate endDate totalAmount');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const project = await GaapProject.findById(req.params.id)
      .populate('customer')
      .populate('assignedTo')
      .populate('salesPerson')
      .populate('products.product');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be directly updated
    delete updateData.createdBy;
    delete updateData.createdAt;

    // Update lastUpdatedBy
    updateData.lastUpdatedBy = req.user._id;

    // If products are being updated, process them
    if (updateData.products) {
      updateData.products = await Promise.all(updateData.products.map(async (product) => {
        const existingProduct = await GaapProduct.findById(product.productId);
        if (!existingProduct) {
          throw new Error(`Product with id ${product.productId} not found`);
        }
        return {
          product: existingProduct._id,
          quantity: product.quantity,
          price: product.price,
          turnoverRange: product.turnoverRange,
          timeDeadline: product.timeDeadline
        };
      }));
    }

    const updatedProject = await GaapProject.findByIdAndUpdate(projectId, updateData, { new: true, runValidators: true });
    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await GaapProject.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};
s