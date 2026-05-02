import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { createDepartmentApi, updateDepartmentApi } from '../../api/departmentApi';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const sanitizePhoneInput = (value) => String(value || '').replace(/[^\d+\-() ]/g, '');

const AddDepartment = ({ route, navigation }) => {
  const { department } = route.params || {};
  const isEditing = Boolean(department?._id);

  const [name, setName] = useState(department?.name || '');
  const [description, setDescription] = useState(department?.description || '');
  const [location, setLocation] = useState(department?.location || '');
  const [contactNumber, setContactNumber] = useState(department?.contactNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const formSubtitle = useMemo(
    () => (isEditing ? 'Update an existing hospital wing' : 'Create a new hospital wing'),
    [isEditing]
  );

  const validate = () => {
    const nextErrors = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedLocation = location.trim();
    const trimmedContactNumber = contactNumber.trim();

    if (!trimmedName) {
      nextErrors.name = 'Department name is required.';
    } else if (trimmedName.length < 3) {
      nextErrors.name = 'Use at least 3 characters.';
    }

    if (!trimmedDescription) {
      nextErrors.description = 'Description is required.';
    } else if (trimmedDescription.length < 10) {
      nextErrors.description = 'Add a little more detail for the department.';
    }

    if (!trimmedLocation) {
      nextErrors.location = 'Location is required.';
    }

    if (trimmedContactNumber && trimmedContactNumber.replace(/\D/g, '').length < 7) {
      nextErrors.contactNumber = 'Enter a valid contact number.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      Alert.alert('Check Details', 'Please correct the highlighted department fields.');
      return;
    }

    setIsSaving(true);

    const payload = {
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      contactNumber: contactNumber.trim(),
    };

    try {
      if (isEditing) {
        await updateDepartmentApi(department._id, payload);
      } else {
        await createDepartmentApi(payload);
      }

      Alert.alert('Success', isEditing ? 'Department updated successfully.' : 'Department added successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error?.response?.data?.message || 'Failed to save department. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return <LoadingSpinner message={isEditing ? 'Updating department...' : 'Creating department...'} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={isEditing ? 'Edit Department' : 'Add Department'}
        subtitle={formSubtitle}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DEPARTMENT INFORMATION</Text>
        <View style={styles.formCard}>
          <CustomInput
            label="Department Name"
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
            }}
            placeholder="e.g. Cardiology"
            autoCapitalize="words"
            errorMessage={errors.name}
          />
          <CustomInput
            label="Description"
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              if (errors.description) setErrors((current) => ({ ...current, description: undefined }));
            }}
            placeholder="Describe the services and care this department provides..."
            multiline
            numberOfLines={5}
            autoCapitalize="sentences"
            errorMessage={errors.description}
          />
          <CustomInput
            label="Location"
            value={location}
            onChangeText={(value) => {
              setLocation(value);
              if (errors.location) setErrors((current) => ({ ...current, location: undefined }));
            }}
            placeholder="e.g. Block B, Level 2"
            autoCapitalize="words"
            errorMessage={errors.location}
          />
          <CustomInput
            label="Contact Number"
            value={contactNumber}
            onChangeText={(value) => {
              setContactNumber(sanitizePhoneInput(value));
              if (errors.contactNumber) setErrors((current) => ({ ...current, contactNumber: undefined }));
            }}
            placeholder="e.g. 011 234 5678"
            keyboardType="phone-pad"
            errorMessage={errors.contactNumber}
          />
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Department Setup Note</Text>
          <Text style={styles.tipText}>
            Keep names short and recognizable so admins can quickly find the correct hospital wing from the dashboard.
          </Text>
        </View>

        <CustomButton
          title={isEditing ? 'Update Department' : 'Save Department'}
          onPress={handleSave}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.tealBright,
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 4,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    ...SHADOW.card,
  },
  tipCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.tealBright,
    ...SHADOW.card,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: FONTS.semibold,
    color: COLORS.navyDeep,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
});

export default AddDepartment;
