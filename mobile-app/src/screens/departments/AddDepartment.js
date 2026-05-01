import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import axios from 'axios';

const AddDepartment = ({ navigation }) => {
    // State to hold form input data
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // Function to handle form submission
    const handleSave = async () => {
        // Basic Form Validation
        if (!name || !description || !location) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }

        try {
            // Replace with your hosted backend URL
            const API_URL = 'https://your-backend-url.com/api/departments'; 
            
            const newDepartment = { name, description, location, contactNumber };
            
            const response = await axios.post(API_URL, newDepartment);

            if (response.status === 201) {
                Alert.alert("Success", "Department added successfully!");
                navigation.goBack(); // Go back to the list screen
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to add department. Please try again.");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Department Name *</Text>
            <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder="e.g., Cardiology"
            />

            <Text style={styles.label}>Description *</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                value={description} 
                onChangeText={setDescription} 
                placeholder="Brief description of the department"
                multiline={true}
                numberOfLines={4}
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput 
                style={styles.input} 
                value={location} 
                onChangeText={setLocation} 
                placeholder="e.g., Floor 2, Room 204"
            />

            <Text style={styles.label}>Contact Number</Text>
            <TextInput 
                style={styles.input} 
                value={contactNumber} 
                onChangeText={setContactNumber} 
                placeholder="e.g., 0112345678"
                keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Save Department</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, color: '#333' },
    input: { 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 8, 
        padding: 12, 
        marginTop: 5,
        fontSize: 16 
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    button: { 
        backgroundColor: '#007bff', 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginTop: 30,
        marginBottom: 50 
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default AddDepartment;