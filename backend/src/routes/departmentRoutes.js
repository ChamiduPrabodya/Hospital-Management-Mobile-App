const express = require('express');
const router = express.Router();
const { 
    getDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
} = require('../controllers/departmentController');

// Define API endpoints for Department CRUD
router.get('/', getDepartments);        // Read all
router.post('/', createDepartment);      // Create
router.put('/:id', updateDepartment);    // Update
router.delete('/:id', deleteDepartment); // Delete

module.exports = router;