const Department = require('../models/Department');

// Get all departments from the database
exports.getDepartments = async (req, res) => {
    try {
        const depts = await Department.find();
        res.status(200).json(depts);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch departments', error: error.message });
    }
};

// Create and save a new department
exports.createDepartment = async (req, res) => {
    try {
        const newDept = new Department(req.body);
        const savedDept = await newDept.save();
        res.status(201).json(savedDept);
    } catch (error) {
        res.status(400).json({ message: 'Failed to create department', error: error.message });
    }
};

// Update an existing department by ID
exports.updateDepartment = async (req, res) => {
    try {
        const updatedDept = await Department.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true } // Return the modified document
        );
        res.status(200).json(updatedDept);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update department', error: error.message });
    }
};

// Delete a department by ID
exports.deleteDepartment = async (req, res) => {
    try {
        await Department.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Failed to delete department', error: error.message });
    }
};