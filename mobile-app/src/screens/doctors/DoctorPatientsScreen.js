import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyPatientsApi } from '../../api/doctorApi';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const formatDate = (value) => {
  if (!value) return 'No visits yet';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const PatientCard = ({ item, onPress }) => {
  const patient = item.patient || {};
  const name = patient.name || 'Patient';
  const initials = name
    .split(' ')
    .map((part) => part?.[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || 'P'}</Text>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {item.hasMedicalNotes ? (
            <View style={styles.noteBadge}>
              <Text style={styles.noteBadgeText}>Notes</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{patient.email || patient.phone || 'No contact details'}</Text>
        <Text style={styles.subMeta}>
          {item.appointmentCount} visit{item.appointmentCount === 1 ? '' : 's'} | Last {formatDate(item.lastAppointment?.appointmentDate)}
        </Text>
        {item.lastServiceName ? <Text style={styles.service} numberOfLines={1}>{item.lastServiceName}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const DoctorPatientsScreen = ({ navigation }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyPatientsApi();
      const data = Array.isArray(res.data) ? res.data : res.data?.data;
      setPatients(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  if (loading && patients.length === 0) return <LoadingSpinner message="Loading patients..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Patients" subtitle={`${patients.length} connected patients`} />
      <FlatList
        data={patients}
        keyExtractor={(item) => item.patient?._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadPatients}
        ListEmptyComponent={
          <EmptyState
            message="No patient history yet"
            subtitle="Patients appear here after they have appointments with you"
          />
        }
        renderItem={({ item }) => (
          <PatientCard
            item={item}
            onPress={() => navigation.navigate('DoctorPatientHistory', {
              patientId: item.patient?._id,
              patient: item.patient,
            })}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { padding: 16, paddingBottom: 34 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 12,
    ...SHADOW.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: COLORS.tealStrong, fontSize: 16, fontWeight: FONTS.bold },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontSize: 15, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  meta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  subMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  service: { fontSize: 12, color: COLORS.tealStrong, fontWeight: FONTS.semibold, marginTop: 4 },
  noteBadge: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  noteBadgeText: { fontSize: 10, color: COLORS.success, fontWeight: FONTS.bold },
});

export default DoctorPatientsScreen;
