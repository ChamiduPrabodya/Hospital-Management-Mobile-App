import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPatientHistoryApi } from '../../api/doctorApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW, statusColor } from '../../theme';

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const AppointmentItem = ({ appointment }) => {
  const colors = statusColor(appointment.status);
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      <View style={styles.timelineBody}>
        <View style={styles.itemTopRow}>
          <Text style={styles.itemTitle}>{appointment.serviceId?.serviceName || 'Service'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>{appointment.status}</Text>
          </View>
        </View>
        <Text style={styles.itemMeta}>
          {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime || 'N/A'}
        </Text>
        {appointment.notes ? <Text style={styles.itemText}>{appointment.notes}</Text> : null}
        {appointment.medicalNote?.text ? (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Medical note</Text>
            <Text style={styles.noteText}>{appointment.medicalNote.text}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const DoctorPatientHistoryScreen = ({ route, navigation }) => {
  const patientId = route.params?.patientId;
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await getPatientHistoryApi(patientId);
      setHistory(res.data?.data || res.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  if (loading && !history) return <LoadingSpinner message="Loading patient history..." />;

  const patient = history?.patient || route.params?.patient || {};
  const appointments = history?.appointments || [];
  const medicalNotes = history?.medicalNotes || [];

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Patient History"
        subtitle={patient.name || 'Past visits and notes'}
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.patientName}>{patient.name || 'Patient'}</Text>
          <Text style={styles.patientEmail}>{patient.email || 'No email address'}</Text>
          <View style={styles.divider} />
          <DetailRow label="Phone" value={patient.phone || 'No phone number'} />
          <DetailRow label="Address" value={patient.address || 'No address'} />
          <DetailRow label="Visits" value={`${history?.appointmentCount || 0}`} />
          <DetailRow label="Notes" value={`${history?.medicalNoteCount || 0}`} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical Notes</Text>
          <Text style={styles.sectionCount}>{medicalNotes.length}</Text>
        </View>
        {medicalNotes.length > 0 ? medicalNotes.map((note) => (
          <View key={`${note.appointmentId}-${note.updatedAt}`} style={styles.card}>
            <Text style={styles.noteDate}>{formatDate(note.appointmentDate)} | {note.serviceName}</Text>
            <Text style={styles.noteText}>{note.text}</Text>
            {note.updatedAt ? <Text style={styles.noteMeta}>Updated {formatDate(note.updatedAt)}</Text> : null}
          </View>
        )) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No medical notes have been added for this patient yet.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Visit Timeline</Text>
          <Text style={styles.sectionCount}>{appointments.length}</Text>
        </View>
        <View style={styles.timelineCard}>
          {appointments.map((appointment) => (
            <AppointmentItem key={appointment._id} appointment={appointment} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  content: { padding: 16, paddingBottom: 36 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 16,
    marginBottom: 12,
    ...SHADOW.card,
  },
  patientName: { fontSize: 20, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  patientEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: FONTS.semibold },
  detailValue: {
    flex: 1,
    marginLeft: 16,
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  sectionCount: { fontSize: 12, color: COLORS.textMuted, fontWeight: FONTS.bold },
  noteDate: { fontSize: 12, color: COLORS.tealStrong, fontWeight: FONTS.bold, marginBottom: 8 },
  noteText: { fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
  noteMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 8 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: 16,
    ...SHADOW.card,
  },
  timelineItem: { flexDirection: 'row', paddingBottom: 16 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.tealStrong,
    marginTop: 5,
    marginRight: 12,
  },
  timelineBody: { flex: 1 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { flex: 1, fontSize: 14, color: COLORS.navyDeep, fontWeight: FONTS.bold },
  itemMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  itemText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 8, lineHeight: 19 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: FONTS.bold, textTransform: 'capitalize' },
  noteBox: { backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.md, padding: 12, marginTop: 10 },
  noteLabel: { fontSize: 10, color: COLORS.tealStrong, fontWeight: FONTS.bold, marginBottom: 5 },
});

export default DoctorPatientHistoryScreen;
