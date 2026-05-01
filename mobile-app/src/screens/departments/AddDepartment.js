import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { createDepartmentApi } from '../../api/departmentApi';

const AddDepartment = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !description || !location) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);

    try {
      await createDepartmentApi({ name, description, location, contactNumber });
      Alert.alert('Success', 'Department added successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to add department. Please try again.'
      );
    } finally {
      setIsSaving(false);
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
        multiline
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

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={isSaving}>
        <Text style={styles.buttonText}>{isSaving ? 'Saving...' : 'Save Department'}</Text>
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
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default AddDepartment;
