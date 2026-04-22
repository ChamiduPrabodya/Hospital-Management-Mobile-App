import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, Switch,
  ScrollView,
} from 'react-native';
import { createDoctorApi, updateDoctorApi } from '../../api/doctorApi';
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
  const [availabilityStatus, setAvailabilityStatus] = useState(
    doctor?.availabilityStatus !== undefined ? Boolean(doctor.availabilityStatus) : true
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !specialization || experience === '') { Alert.alert('Error', 'Please fill required fields'); return; }
    if (!doctor && (!email.trim() || !password.trim())) {
      Alert.alert('Error', 'Please add a unique email and password for the doctor login');
      return;
    }
    if (password.trim() && password.trim().length < 6) {
      Alert.alert('Error', 'Doctor password must be at least 6 characters');
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
      await (doctor ? updateDoctorApi(doctor._id, data) : createDoctorApi(data));
      navigation.goBack();
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
            placeholder={doctor ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
            secureTextEntry
          />
          <Text style={styles.helpText}>
            {doctor
              ? 'Changing the password here will update this doctor login.'
              : 'This email and password will be used by the doctor to log in.'}
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
