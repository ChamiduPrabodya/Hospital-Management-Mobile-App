import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, Switch,
  ScrollView, TouchableOpacity, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createDoctorApi, updateDoctorApi } from '../../api/doctorApi';
import { uploadDoctorImageApi } from '../../api/uploadApi';
import { validateEmail, validateStrongPassword } from '../../utils/validators';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const DoctorFormScreen = ({ route, navigation }) => {
  const { doctor } = route.params || {};
  const [name, setName] = useState(doctor?.name || '');
  const [specialization, setSpecialization] = useState(doctor?.specialization || '');
  const [experience, setExperience] = useState(doctor?.experience?.toString() || '');
  const [description, setDescription] = useState(doctor?.description || '');
  const [consultationFee, setConsultationFee] = useState(doctor?.consultationFee?.toString() || '');
  const [email, setEmail] = useState(doctor?.userId?.email || '');
  const [password, setPassword] = useState('');
  const [imageUri, setImageUri] = useState(doctor?.image || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [availabilityStatus, setAvailabilityStatus] = useState(
    doctor?.availabilityStatus !== undefined ? Boolean(doctor.availabilityStatus) : true
  );
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo access to choose a doctor image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
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
    formData.append('doctorImage', {
      uri: selectedImage.uri,
      name,
      type,
    });

    await uploadDoctorImageApi(formData);
  };

  const handleSubmit = async () => {
    if (!name || !specialization || experience === '') { Alert.alert('Error', 'Please fill required fields'); return; }
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

    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = {
        name,
        specialization,
        experience: exp,
        description,
        consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
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
          <CustomInput label="Specialization" value={specialization} onChangeText={setSpecialization} placeholder="e.g. Cardiologist" />
          <CustomInput label="Experience (yrs)" value={experience} onChangeText={setExperience} placeholder="e.g. 5" keyboardType="numeric" />
          <CustomInput label="Consultation Fee (LKR)" value={consultationFee} onChangeText={setConsultationFee} placeholder="e.g. 2500" keyboardType="numeric" />
          <CustomInput label="Description" value={description} onChangeText={setDescription} placeholder="Brief bio..." multiline numberOfLines={4} />
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
