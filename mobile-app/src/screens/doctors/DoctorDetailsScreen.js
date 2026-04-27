import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import CustomButton from '../../components/CustomButton';

const DoctorDetailsScreen = ({ route, navigation }) => {
  const { doctor } = route.params;
  const imageUri = doctor?.userId?.profileImage || doctor?.image;
  const consultationFee = doctor?.consultationFee !== undefined && doctor?.consultationFee !== null
    ? `LKR ${Number(doctor.consultationFee).toLocaleString()}`
    : 'N/A';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.doctorImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>{doctor?.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
          </View>
        )}
        <Text style={styles.name}>{doctor?.name || 'Doctor Name'}</Text>
        <Text style={styles.specialization}>{doctor?.specialization || 'Medical Specialist'}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Experience</Text>
            <Text style={styles.infoValue}>{doctor?.experience ?? 'N/A'} yrs</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Consultation Fee</Text>
            <Text style={styles.infoValue}>{consultationFee}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: doctor?.availabilityStatus ? '#dcfce7' : '#fee2e2' }]}>
          <Text style={[styles.badgeText, { color: doctor?.availabilityStatus ? '#166534' : '#991b1b' }]}> 
            {doctor?.availabilityStatus ? 'Available now' : 'Not currently available'}
          </Text>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>About this doctor</Text>
        <Text style={styles.description}>
          {doctor?.description || 'No additional information is available yet.'}
        </Text>
      </View>

      <CustomButton
        title="Book Appointment"
        onPress={() => navigation.navigate('AppointmentBooking', { doctor })}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  doctorImage: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#f1f5f9',
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#e0f2f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#0d7f6f',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  specialization: {
    fontSize: 16,
    color: '#475569',
    marginTop: 6,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    width: '100%',
  },
  infoBlock: {
    flex: 1,
    paddingRight: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    marginTop: 18,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
});

export default DoctorDetailsScreen;
