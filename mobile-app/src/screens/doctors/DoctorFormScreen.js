import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, Switch,
  ScrollView, TouchableOpacity, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createDoctorApi, getDoctorsApi, updateDoctorApi } from '../../api/doctorApi';
import { getAllDepartments } from '../../api/departmentApi';
import { createServiceApi, getServicesApi } from '../../api/serviceApi';
import { uploadDoctorImageApi } from '../../api/uploadApi';
import { validateEmail, validateStrongPassword } from '../../utils/validators';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const OTHER_SECTION = 'Other';

const formatManualSpecialization = (value) => {
  const trimmedStart = String(value || '').replace(/^\s+/, '');
  if (!trimmedStart) return '';
  return trimmedStart.charAt(0).toUpperCase() + trimmedStart.slice(1);
};

const DoctorFormScreen = ({ route, navigation }) => {
  const { doctor } = route.params || {};
  const [name, setName] = useState(doctor?.name || '');
  const [specialization, setSpecialization] = useState(doctor?.specialization || '');
  const [departmentId, setDepartmentId] = useState(doctor?.departmentId?._id || doctor?.departmentId || '');
  const [departments, setDepartments] = useState([]);
  const [manualSpecialization, setManualSpecialization] = useState('');
  const [useOtherSpecialization, setUseOtherSpecialization] = useState(false);
  const [existingSpecializations, setExistingSpecializations] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [doctorServices, setDoctorServices] = useState(() => (
    Array.isArray(doctor?.services)
      ? doctor.services.map((item) => ({
        serviceId: item.serviceId?._id || item.serviceId,
        price: item.price?.toString() || '',
        duration: item.duration?.toString() || '',
        availabilityStatus: item.availabilityStatus !== false,
      }))
      : []
  ));
  const [experience, setExperience] = useState(doctor?.experience?.toString() || '');
  const [description, setDescription] = useState(doctor?.description || '');
  const [email, setEmail] = useState(doctor?.userId?.email || '');
  const [password, setPassword] = useState('');
  const [imageUri, setImageUri] = useState(doctor?.image || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState(
    doctor?.availabilityStatus !== undefined ? Boolean(doctor.availabilityStatus) : true
  );
  const [loading, setLoading] = useState(false);

  const filteredServiceOptions = useMemo(() => (
    departmentId
      ? serviceOptions.filter((item) => (item.departmentId?._id || item.departmentId) === departmentId)
      : serviceOptions
  ), [departmentId, serviceOptions]);

  const sectionOptions = useMemo(() => {
    const values = [...existingSpecializations];
    if (doctor?.specialization && !values.includes(doctor.specialization)) {
      values.unshift(doctor.specialization);
    }
    return values;
  }, [doctor?.specialization, existingSpecializations]);

  useEffect(() => {
    (async () => {
      try {
        const [doctorResponse, serviceResponse, departmentResponse] = await Promise.all([
          getDoctorsApi(),
          getServicesApi(),
          getAllDepartments(),
        ]);
        const doctorData = Array.isArray(doctorResponse.data) ? doctorResponse.data : doctorResponse.data?.data;
        const sections = Array.isArray(doctorData)
          ? doctorData
            .map((item) => String(item.specialization || '').trim())
            .filter(Boolean)
          : [];
        setExistingSpecializations(Array.from(new Set(sections)).sort((a, b) => a.localeCompare(b)));
        const services = Array.isArray(serviceResponse.data) ? serviceResponse.data : serviceResponse.data?.data;
        setServiceOptions(Array.isArray(services) ? services.filter((item) => item.availabilityStatus !== false) : []);
        const departmentData = Array.isArray(departmentResponse.data)
          ? departmentResponse.data
          : departmentResponse.data?.data;
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
      } catch (error) {
        console.log('Failed to load doctor form options:', error.response?.data?.message || error.message);
      }
    })();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo access to choose a doctor image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    setImageUri(asset.uri);
    setSelectedImage(asset);
  };

  const uploadSelectedImage = async (doctorId) => {
    if (!selectedImage || !doctorId) return;

    const uriParts = selectedImage.uri.split('/');
    const fallbackName = `doctor-${doctorId}.jpg`;
    const name = selectedImage.fileName || uriParts[uriParts.length - 1] || fallbackName;
    const extension = name.split('.').pop()?.toLowerCase();
    const type = selectedImage.mimeType || (extension === 'png' ? 'image/png' : 'image/jpeg');

    const formData = new FormData();
    formData.append('doctorId', doctorId);
    formData.append(
      'doctorImage',
      selectedImage.file || {
        uri: selectedImage.uri,
        name,
        type,
      }
    );

    await uploadDoctorImageApi(formData);
  };

  const handleManualSpecializationChange = (value) => {
    setManualSpecialization(formatManualSpecialization(value));
  };

  const selectSection = (section) => {
    if (section === OTHER_SECTION) {
      setUseOtherSpecialization(true);
      setSpecialization('');
      return;
    }

    setUseOtherSpecialization(false);
    setSpecialization(section);
    setManualSpecialization('');
  };

  const selectDepartment = (nextDepartmentId) => {
    setDepartmentId(nextDepartmentId);
    setDoctorServices((prev) => prev.filter((item) => {
      const linkedService = serviceOptions.find((service) => service._id === item.serviceId);
      return linkedService && (linkedService.departmentId?._id || linkedService.departmentId) === nextDepartmentId;
    }));
  };

  const isDoctorServiceSelected = (serviceId) => doctorServices.some((item) => item.serviceId === serviceId);

  const toggleDoctorService = (service) => {
    setDoctorServices((prev) => {
      if (prev.some((item) => item.serviceId === service._id)) {
        return prev.filter((item) => item.serviceId !== service._id);
      }

      return [
        ...prev,
        {
          serviceId: service._id,
          price: service.price?.toString() || '',
          duration: service.duration?.toString() || '',
          availabilityStatus: true,
        },
      ];
    });
  };

  const updateDoctorService = (serviceId, field, value) => {
    setDoctorServices((prev) =>
      prev.map((item) => (item.serviceId === serviceId ? { ...item, [field]: value } : item))
    );
  };

  const handleAddNewService = async () => {
    const price = Number(newServicePrice);
    const duration = Number(newServiceDuration);

    if (!newServiceName.trim() || !newServiceDescription.trim()) {
      Alert.alert('Error', 'Please enter the new service name and description');
      return;
    }

    if (!departmentId) {
      Alert.alert('Error', 'Please select a department before creating a new service');
      return;
    }

    if (Number.isNaN(price) || price <= 0 || !Number.isInteger(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid service price and duration');
      return;
    }

    setAddingService(true);
    try {
      const response = await createServiceApi({
        departmentId,
        serviceName: newServiceName.trim(),
        description: newServiceDescription.trim(),
        price,
        duration,
        availabilityStatus: true,
      });
      const savedService = response.data?.data || response.data;

      setServiceOptions((prev) => [...prev, savedService]);
      setDoctorServices((prev) => [
        ...prev.filter((item) => item.serviceId !== savedService._id),
        {
          serviceId: savedService._id,
          price: String(price),
          duration: String(duration),
          availabilityStatus: true,
        },
      ]);
      setNewServiceName('');
      setNewServiceDescription('');
      setNewServicePrice('');
      setNewServiceDuration('');
      Alert.alert('Service Added', 'The new service was added and selected for this doctor.');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add service');
    } finally {
      setAddingService(false);
    }
  };

  const handleSubmit = async () => {
    const finalSpecialization = useOtherSpecialization
      ? formatManualSpecialization(manualSpecialization).trim()
      : specialization.trim();

    if (!name || !departmentId || !finalSpecialization || experience === '') { Alert.alert('Error', 'Please fill required fields'); return; }
    if (!doctor && (!email.trim() || !password.trim())) {
      Alert.alert('Error', 'Please add a unique email and password for the doctor login');
      return;
    }
    if (!email.trim() || !validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid unique email for the doctor login');
      return;
    }
    if (password.trim() && !validateStrongPassword(password.trim())) {
      Alert.alert('Error', 'Doctor password must use 8+ characters with uppercase, lowercase, number, and symbol');
      return;
    }
    const exp = parseInt(experience);
    if (Number.isNaN(exp) || exp < 0) { Alert.alert('Error', 'Experience must be a valid number'); return; }
    if (doctorServices.length === 0) {
      Alert.alert('Error', 'Please select at least one service this doctor provides');
      return;
    }

    const normalizedServices = doctorServices.map((item) => ({
      serviceId: item.serviceId,
      price: Number(item.price),
      duration: Number(item.duration),
      availabilityStatus: item.availabilityStatus !== false,
    }));
    const invalidService = normalizedServices.find((item) =>
      !item.serviceId
      || Number.isNaN(item.price)
      || item.price <= 0
      || !Number.isInteger(item.duration)
      || item.duration <= 0
    );
    if (invalidService) {
      Alert.alert('Error', 'Please enter a valid price and duration for every selected doctor service');
      return;
    }

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = {
        name,
        departmentId,
        specialization: finalSpecialization,
        experience: exp,
        description,
        services: normalizedServices,
        availabilityStatus,
      };
      if (!doctor || normalizedEmail) data.email = normalizedEmail;
      if (password.trim()) data.password = password.trim();
      const response = await (doctor ? updateDoctorApi(doctor._id, data) : createDoctorApi(data));
      const savedDoctor = response.data?.data || response.data;
      await uploadSelectedImage(savedDoctor?._id || doctor?._id);
      Alert.alert(
        doctor ? 'Doctor Updated' : 'Doctor Created',
        doctor
          ? 'The doctor profile and login details have been updated.'
          : 'The doctor can now sign in with the email and password you entered.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Saving doctor..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={doctor ? 'Edit Doctor' : 'Add Doctor'}
        subtitle={doctor ? 'Update specialist profile' : 'Register a new specialist'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
        <View style={styles.formCard}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.85}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.doctorImage} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>+</Text>
              </View>
            )}
            <View style={styles.imageTextWrap}>
              <Text style={styles.imageTitle}>{imageUri ? 'Change Doctor Image' : 'Add Doctor Image'}</Text>
              <Text style={styles.imageSub}>JPG or PNG, square photo works best</Text>
            </View>
          </TouchableOpacity>
          <CustomInput label="Full Name" value={name} onChangeText={setName} placeholder="Dr. Full Name" />
          <Text style={styles.inputLabel}>Department</Text>
          <View style={styles.sectionPicker}>
            {departments.map((department) => {
              const selected = departmentId === department._id;
              return (
                <TouchableOpacity
                  key={department._id}
                  style={[styles.sectionChip, selected && styles.sectionChipSelected]}
                  onPress={() => selectDepartment(department._id)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.sectionChipText, selected && styles.sectionChipTextSelected]}>
                    {department.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.inputLabel}>Specialized Section</Text>
          <View style={styles.sectionPicker}>
            {sectionOptions.map((section) => {
              const selected = !useOtherSpecialization && specialization === section;
              return (
                <TouchableOpacity
                  key={section}
                  style={[styles.sectionChip, selected && styles.sectionChipSelected]}
                  onPress={() => selectSection(section)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.sectionChipText, selected && styles.sectionChipTextSelected]}>
                    {section}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.sectionChip, useOtherSpecialization && styles.sectionChipSelected]}
              onPress={() => selectSection(OTHER_SECTION)}
              activeOpacity={0.85}
            >
              <Text style={[styles.sectionChipText, useOtherSpecialization && styles.sectionChipTextSelected]}>
                Other
              </Text>
            </TouchableOpacity>
          </View>
          {useOtherSpecialization ? (
            <CustomInput
              label="New Section"
              value={manualSpecialization}
              onChangeText={handleManualSpecializationChange}
              placeholder="e.g. Neurology"
            />
          ) : null}
          <CustomInput label="Experience (yrs)" value={experience} onChangeText={setExperience} placeholder="e.g. 5" keyboardType="numeric" />
          <CustomInput label="Description" value={description} onChangeText={setDescription} placeholder="Brief bio..." multiline numberOfLines={4} />
        </View>

        <Text style={styles.sectionLabel}>DOCTOR SERVICES</Text>
        <View style={styles.formCard}>
          <View style={styles.newServiceBox}>
            <Text style={styles.newServiceTitle}>Add New Service</Text>
            <Text style={styles.newServiceSub}>Use this when the service is not in the list below.</Text>
            <CustomInput
              label="Service Name"
              value={newServiceName}
              onChangeText={setNewServiceName}
              placeholder="e.g. Skin Consultation"
            />
            <CustomInput
              label="Description"
              value={newServiceDescription}
              onChangeText={setNewServiceDescription}
              placeholder="Describe what this service includes..."
              multiline
              numberOfLines={3}
            />
            <CustomInput
              label="Price (LKR)"
              value={newServicePrice}
              onChangeText={setNewServicePrice}
              placeholder="e.g. 2500"
              keyboardType="numeric"
            />
            <CustomInput
              label="Duration (minutes)"
              value={newServiceDuration}
              onChangeText={setNewServiceDuration}
              placeholder="e.g. 30"
              keyboardType="numeric"
            />
            <CustomButton
              title={addingService ? 'Adding Service...' : 'Add Service'}
              onPress={handleAddNewService}
              disabled={addingService}
              variant="outline"
              style={styles.addServiceBtn}
            />
          </View>

          {filteredServiceOptions.length === 0 ? (
            <Text style={styles.emptyText}>
              {departmentId
                ? 'No services are available for this department yet. Add one above to continue.'
                : 'Choose a department first, then assign services here.'}
            </Text>
          ) : (
            filteredServiceOptions.map((service) => {
              const selected = isDoctorServiceSelected(service._id);
              const selectedService = doctorServices.find((item) => item.serviceId === service._id);
              return (
                <View key={service._id} style={styles.doctorServiceItem}>
                  <TouchableOpacity
                    style={[styles.serviceToggle, selected && styles.serviceToggleSelected]}
                    onPress={() => toggleDoctorService(service)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.serviceCheck, selected && styles.serviceCheckSelected]}>
                      {selected ? <Text style={styles.serviceCheckText}>Y</Text> : null}
                    </View>
                    <View style={styles.serviceToggleText}>
                      <Text style={[styles.serviceToggleName, selected && styles.serviceToggleNameSelected]}>
                        {service.serviceName}
                      </Text>
                      <Text style={styles.serviceToggleMeta}>
                        Default LKR {Number(service.price || 0).toLocaleString()} - {service.duration || 0} min
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {selected ? (
                    <View style={styles.serviceInputs}>
                      <CustomInput
                        label="Doctor Price (LKR)"
                        value={selectedService?.price || ''}
                        onChangeText={(value) => updateDoctorService(service._id, 'price', value)}
                        placeholder="e.g. 2500"
                        keyboardType="numeric"
                      />
                      <CustomInput
                        label="Duration (minutes)"
                        value={selectedService?.duration || ''}
                        onChangeText={(value) => updateDoctorService(service._id, 'duration', value)}
                        placeholder="e.g. 30"
                        keyboardType="numeric"
                      />
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.sectionLabel}>DOCTOR LOGIN</Text>
        <View style={styles.formCard}>
          <CustomInput
            label="Unique Email"
            value={email}
            onChangeText={setEmail}
            placeholder="doctor@example.com"
            keyboardType="email-address"
          />
          <CustomInput
            label={doctor ? 'New Password (optional)' : 'Password'}
            value={password}
            onChangeText={setPassword}
            placeholder={doctor ? 'Leave blank to keep current password' : '8+ chars, upper, lower, number, symbol'}
            secureTextEntry
          />
          <Text style={styles.helpText}>
            {doctor
              ? 'Changing the password here will update this doctor login. Use 8+ characters with uppercase, lowercase, number, and symbol.'
              : 'This email and password will be used by the doctor to log in. Use 8+ characters with uppercase, lowercase, number, and symbol.'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>AVAILABILITY</Text>
        <View style={styles.toggleCard}>
          <View>
            <Text style={styles.toggleLabel}>Mark as Available</Text>
            <Text style={styles.toggleSub}>Patients can book appointments</Text>
          </View>
          <Switch
            value={availabilityStatus}
            onValueChange={setAvailabilityStatus}
            trackColor={{ false: COLORS.tealPale, true: COLORS.tealBright }}
            thumbColor={COLORS.white}
          />
        </View>

        <CustomButton
          title={doctor ? 'Update Doctor' : 'Create Doctor'}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />
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
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
    backgroundColor: COLORS.bgPage,
  },
  doctorImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.bgMuted,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
  },
  imageTextWrap: { flex: 1, marginLeft: 14 },
  imageTitle: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  imageSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  inputLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: FONTS.semibold,
    marginBottom: 8,
  },
  sectionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sectionChip: {
    minHeight: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgPage,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sectionChipSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  sectionChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: FONTS.semibold,
  },
  sectionChipTextSelected: {
    color: COLORS.white,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  newServiceBox: {
    backgroundColor: COLORS.bgPage,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 16,
  },
  newServiceTitle: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
  },
  newServiceSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    marginBottom: 10,
    lineHeight: 16,
  },
  addServiceBtn: {
    marginTop: 0,
    marginBottom: 0,
  },
  doctorServiceItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: 10,
    marginBottom: 10,
  },
  serviceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    padding: 12,
    backgroundColor: COLORS.bgPage,
  },
  serviceToggleSelected: {
    borderColor: COLORS.tealStrong,
    backgroundColor: COLORS.tealFaint,
  },
  serviceCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.tealPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceCheckSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  serviceCheckText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: FONTS.bold,
  },
  serviceToggleText: {
    flex: 1,
  },
  serviceToggleName: {
    fontSize: 14,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
  },
  serviceToggleNameSelected: {
    color: COLORS.tealStrong,
  },
  serviceToggleMeta: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  serviceInputs: {
    marginTop: 10,
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgPage,
    marginRight: 8,
  },
  modeBtnSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  modeBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: FONTS.semibold,
  },
  modeBtnTextSelected: {
    color: COLORS.white,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgPage,
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 8,
  },
  scheduleTextWrap: {
    flex: 1,
  },
  scheduleDate: {
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
  },
  scheduleSlots: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  dateSelectRow: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder || COLORS.divider,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  dateSelectText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.navyDeep,
    fontWeight: FONTS.medium,
  },
  dateSelectPlaceholder: {
    color: COLORS.textPlaceholder || COLORS.textMuted,
  },
  dateSelectArrow: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: FONTS.bold,
  },
  calendarBox: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarTitle: {
    fontSize: 15,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
  },
  calendarNavBtn: {
    width: 34,
    height: 30,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnDisabled: {
    opacity: 0.35,
  },
  calendarNavText: {
    color: COLORS.navyDeep,
    fontSize: 16,
    fontWeight: FONTS.bold,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayBlank: {
    width: `${100 / 7}%`,
    height: 38,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  calendarDaySelected: {
    backgroundColor: COLORS.tealStrong,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
  },
  calendarDayTextSelected: {
    color: COLORS.white,
  },
  calendarDayTextDisabled: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  removeScheduleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeScheduleText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: FONTS.bold,
  },
  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 20, ...SHADOW.card,
  },
  toggleLabel: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.navyDeep },
  toggleSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  helpText: { fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginTop: -2 },
  submitBtn: { marginTop: 4 },
});

export default DoctorFormScreen;
