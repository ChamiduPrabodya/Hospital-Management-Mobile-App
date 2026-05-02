import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { createServiceApi, updateServiceApi } from '../../api/serviceApi';
import { getAllDepartments } from '../../api/departmentApi';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const ServiceFormScreen = ({ route, navigation }) => {
  const { service } = route.params || {};
  const [serviceName, setServiceName] = useState(service?.serviceName || '');
  const [description, setDescription] = useState(service?.description || '');
  const [price, setPrice] = useState(service?.price?.toString() || '');
  const [duration, setDuration] = useState(service?.duration?.toString() || '');
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState(service?.departmentId?._id || service?.departmentId || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(
    service?.availabilityStatus !== undefined ? Boolean(service.availabilityStatus) : true
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await getAllDepartments();
        const departmentData = Array.isArray(response.data) ? response.data : response.data?.data;
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
      } catch (error) {
        Alert.alert('Load Failed', error.response?.data?.message || 'Could not load departments');
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!departmentId || !serviceName || !description || !price || !duration) {
      Alert.alert('Missing Fields', 'Please select a department and fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const data = {
        departmentId,
        serviceName, description,
        price: parseFloat(price),
        duration: parseInt(duration),
        availabilityStatus,
      };
      service ? await updateServiceApi(service._id, data) : await createServiceApi(data);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message={service ? 'Updating service...' : 'Creating service...'} />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={service ? 'Edit Service' : 'Add Service'}
        subtitle={service ? 'Update service details' : 'Create a new hospital service'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>DEPARTMENT</Text>
        <View style={styles.formCard}>
          <Text style={styles.helperText}>Choose the hospital department that owns this service.</Text>
          <View style={styles.chipRow}>
            {departments.map((department) => {
              const selected = departmentId === department._id;
              return (
                <TouchableOpacity
                  key={department._id}
                  style={[styles.departmentChip, selected && styles.departmentChipSelected]}
                  onPress={() => setDepartmentId(department._id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.departmentChipText, selected && styles.departmentChipTextSelected]}>
                    {department.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>SERVICE INFORMATION</Text>
        <View style={styles.formCard}>
          <CustomInput label="Service Name" value={serviceName} onChangeText={setServiceName} placeholder="e.g. General Consultation" />
          <CustomInput label="Description" value={description} onChangeText={setDescription} placeholder="Describe what this service includes..." multiline numberOfLines={4} />
          <CustomInput label="Price (LKR)" value={price} onChangeText={setPrice} placeholder="e.g. 1500" keyboardType="numeric" />
          <CustomInput label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="e.g. 30" keyboardType="numeric" />
        </View>

        <Text style={styles.sectionLabel}>AVAILABILITY</Text>
        <View style={styles.toggleCard}>
          <View>
            <Text style={styles.toggleLabel}>Mark as Available</Text>
            <Text style={styles.toggleSub}>Patients can select this service</Text>
          </View>
          <Switch
            value={availabilityStatus}
            onValueChange={setAvailabilityStatus}
            trackColor={{ false: COLORS.tealPale, true: COLORS.tealBright }}
            thumbColor={COLORS.white}
          />
        </View>

        <CustomButton title={service ? 'Update Service' : 'Create Service'} onPress={handleSubmit} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 10, marginLeft: 4, marginTop: 4 },
  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  helperText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  departmentChip: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPage,
    marginRight: 8,
    marginBottom: 8,
  },
  departmentChipSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  departmentChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: FONTS.semibold },
  departmentChipTextSelected: { color: COLORS.white },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 20, ...SHADOW.card,
  },
  toggleLabel: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.navyDeep },
  toggleSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});

export default ServiceFormScreen;
