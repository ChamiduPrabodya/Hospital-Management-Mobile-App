import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, statusColor } from '../theme';

const AppointmentCard = ({ appointment, onPress, viewerRole }) => {
  const sc = statusColor(appointment.status);
  const isPaid = appointment.paymentStatus === 'paid';
  const patientName = appointment.userId?.name || appointment.patientId?.name || 'Unknown patient';
  const doctorName = appointment.doctorId?.name || 'Unknown doctor';
  const serviceName = appointment.serviceId?.serviceName || 'Unknown service';
  const title = viewerRole === 'patient' ? doctorName : patientName;
  const subtitle = viewerRole === 'admin'
    ? `${doctorName} - ${serviceName}`
    : serviceName;
  const hasMedicalNote = Boolean(appointment.medicalNote?.text);
  const paymentColor = isPaid
    ? { bg: COLORS.successBg, text: COLORS.success, label: 'Paid' }
    : { bg: '#FEF3C7', text: COLORS.warning, label: 'Pending' };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: sc.text }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.doctor}>{title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.service}>{subtitle}</Text>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment</Text>
          <View style={[styles.paymentBadge, { backgroundColor: paymentColor.bg }]}>
            <Text style={[styles.paymentText, { color: paymentColor.text }]}>
              {paymentColor.label}
            </Text>
          </View>
          {hasMedicalNote ? (
            <View style={styles.noteBadge}>
              <Text style={styles.noteText}>Medical note</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>
              {new Date(appointment.appointmentDate).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Time</Text>
            <Text style={styles.metaValue}>{appointment.appointmentTime}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginHorizontal: 16,
    marginVertical: 6,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  accent: {
    width: 4,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  },
  body: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctor: {
    fontSize: 15,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  service: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginRight: 8,
  },
  paymentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  paymentText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  noteBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.tealFaint,
    marginLeft: 8,
  },
  noteText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: FONTS.medium,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.divider,
    marginHorizontal: 12,
  },
});

export default AppointmentCard;
