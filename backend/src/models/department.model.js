const mongoose = require('mongoose');

// Define the schema for the Department entity
const departmentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Department name is required'],
        trim: true 
    },
    description: { 
        type: String, 
        required: [true, 'Description is required'] 
    },
    location: { 
        type: String, 
        required: [true, 'Location (Floor/Room) is required'] 
    },
    contactNumber: { 
        type: String 
    }
}, { 
    // Automatically manage createdAt and updatedAt fields
    timestamps: true 
});

module.exports = mongoose.model('Department', departmentSchema);