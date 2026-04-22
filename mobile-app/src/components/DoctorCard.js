import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const DoctorCard = ({ doctor, onPress }) => {
  const fee = doctor.consultationFee !== undefined && doctor.consultationFee !== null
    ? `LKR ${Number(doctor.consultationFee).toLocaleString()}`
    : 'N/A';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={[styles.statusDot, { backgroundColor: doctor.availabilityStatus ? '#16a34a' : '#dc2626' }]} />
      <View style={styles.info}>
        <Text style={styles.name}>{doctor.name || 'Doctor name'}</Text>
        <Text style={styles.specialization}>{doctor.specialization || 'Specialist'}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Fee: {fee}</Text>
          <Text style={styles.metaText}>{doctor.experience ?? 0} yrs exp</Text>
        </View>
        <Text style={[styles.availability, { color: doctor.availabilityStatus ? '#16a34a' : '#dc2626' }]}> 
          {doctor.availabilityStatus ? 'Available' : 'Not Available'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 15,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 12,
  },
  info: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  specialization: {
    fontSize: 16,
    color: '#666',
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    marginRight: 16,
  },
  fee: {
    fontSize: 14,
    color: '#007bff',
  },
  availability: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default DoctorCard;
