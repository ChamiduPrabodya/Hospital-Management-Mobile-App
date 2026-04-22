import React, { useCallback, useContext, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  Platform, StatusBar, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAppointmentByIdApi } from '../../api/appointmentApi';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW, statusColor } from '../../theme';

const DetailRow = ({ label, value, valueStyle }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
  </View>
);

const AppointmentDetailsScreen = ({ route, navigation }) => {
  const [appointment, setAppointment] = useState(route.params.appointment);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useContext(AuthContext);
  const isPatient = userInfo?.role === 'patient';
  const sc = statusColor(appointment.status);
  const isPaid = appointment.paymentStatus === 'paid';

  const loadAppointment = useCallback(async () => {
    if (!appointment?._id) return;
    setLoading(true);
    try {
      const res = await getAppointmentByIdApi(appointment._id);
      const freshAppointment = res.data?.data || res.data;
      if (freshAppointment?._id) setAppointment(freshAppointment);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to refresh appointment');
    } finally {
      setLoading(false);
    }
  }, [appointment?._id]);

  useFocusEffect(
    useCallback(() => {
      loadAppointment();
    }, [loadAppointment])
  );

  if (loading && !appointment) return <LoadingSpinner message="Loading appointment..." />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.circle1} /><View style={styles.circle2} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <View style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.heroEst}>VICTORIA HOSPITAL</Text>
        <Text style={styles.heroTitle}>Appointment Details</Text>
        <View style={styles.accentBar} />
        <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <View style={[styles.statusDot, { backgroundColor: sc.text }]} />
          <Text style={styles.statusBadgeText}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Main info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Information</Text>
          <View style={styles.divider} />
          <DetailRow label="Patient" value={appointment.userId?.name || appointment.patientId?.name || 'Unknown'} />
          <View style={styles.divider} />
          <DetailRow label="Doctor" value={appointment.doctorId?.name || 'Unknown'} />
          <View style={styles.divider} />
          <DetailRow label="Service" value={appointment.serviceId?.serviceName || 'Unknown service'} />
          {appointment.serviceId?.price !== undefined ? (
            <>
              <View style={styles.divider} />
              <DetailRow label="Price" value={`LKR ${Number(appointment.serviceId.price).toLocaleString()}`} />
            </>
          ) : null}
          {appointment.serviceId?.duration ? (
            <>
              <View style={styles.divider} />
              <DetailRow label="Duration" value={`${appointment.serviceId.duration} min`} />
            </>
          ) : null}
          <View style={styles.divider} />
          <DetailRow
            label="Date"
            value={appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'long', year: 'numeric',
            }) : 'N/A'}
          />
          <View style={styles.divider} />
          <DetailRow label="Time" value={appointment.appointmentTime || 'N/A'} />
          {appointment.createdAt ? (
            <>
              <View style={styles.divider} />
              <DetailRow
                label="Booked on"
                value={new Date(appointment.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              />
            </>
          ) : null}
          <View style={styles.divider} />
          <DetailRow
            label="Status"
            value={(appointment.status || 'pending').charAt(0).toUpperCase() + (appointment.status || 'pending').slice(1)}
            valueStyle={{ color: sc.text, fontWeight: FONTS.bold }}
          />
          <View style={styles.divider} />
          <DetailRow
            label="Payment"
            value={isPaid ? 'Paid' : 'Pending'}
            valueStyle={{ color: isPaid ? COLORS.success : COLORS.warning, fontWeight: FONTS.bold }}
          />
          {appointment.paidAt ? (
            <>
              <View style={styles.divider} />
              <DetailRow
                label="Paid on"
                value={new Date(appointment.paidAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              />
            </>
          ) : null}
        </View>

        {/* Notes card */}
        {appointment.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>PATIENT NOTES</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        ) : null}

        {/* Payment action */}
        {isPatient && appointment.status === 'approved' && !isPaid ? (
          <View style={styles.paymentBanner}>
            <View>
              <Text style={styles.paymentBannerTitle}>Payment Required</Text>
              <Text style={styles.paymentBannerSub}>Your appointment has been approved</Text>
            </View>
            <CustomButton
              title="Pay Now"
              onPress={() => navigation.navigate('PaymentForm', {
                appointmentId: appointment._id,
                appointment,
                amount: appointment.serviceId?.price,
              })}
              style={styles.payBtn}
            />
          </View>
        ) : null}
        {isPatient && appointment.status === 'approved' && isPaid ? (
          <View style={styles.paymentBanner}>
            <View>
              <Text style={styles.paymentBannerTitle}>Payment Completed</Text>
              <Text style={styles.paymentBannerSub}>This appointment payment is already recorded</Text>
            </View>
            <CustomButton
              title="View Payments"
              onPress={() => navigation.navigate('Tabs', { screen: 'Payments' })}
              style={styles.payBtn}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },

  hero: {
    backgroundColor: COLORS.navyMid,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -60 },
  circle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  backArrow: { width: 10, height: 10, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: COLORS.white, transform: [{ rotate: '45deg' }], marginLeft: 3 },
  heroEst: { fontSize: 9, letterSpacing: 2.2, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  heroTitle: { fontSize: 22, fontWeight: FONTS.bold, color: COLORS.white },
  accentBar: { width: 36, height: 3, backgroundColor: COLORS.tealLight, borderRadius: 2, marginVertical: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginRight: 7 },
  statusBadgeText: { fontSize: 12, fontWeight: FONTS.semibold, color: COLORS.white },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 14, ...SHADOW.card,
  },
  cardTitle: { fontSize: 13, fontWeight: FONTS.bold, color: COLORS.navyDeep, letterSpacing: 0.3, marginBottom: 12 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: FONTS.medium },
  rowValue: { fontSize: 13, color: COLORS.navyDeep, fontWeight: FONTS.semibold },

  notesCard: {
    backgroundColor: COLORS.tealFaint, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.tealBright,
  },
  notesLabel: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealStrong, letterSpacing: 1.5, marginBottom: 6 },
  notesText: { fontSize: 13, color: COLORS.navyDeep, lineHeight: 20 },

  paymentBanner: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, ...SHADOW.card,
    borderLeftWidth: 4, borderLeftColor: COLORS.tealStrong,
  },
  paymentBannerTitle: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  paymentBannerSub: { fontSize: 12, fontWeight: FONTS.regular, color: COLORS.textMuted, marginTop: 2, marginBottom: 12 },
  payBtn: { marginTop: 0, marginVertical: 0 },
});

export default AppointmentDetailsScreen;
