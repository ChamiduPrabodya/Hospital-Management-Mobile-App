import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { createAppointmentApi } from '../../api/appointmentApi';
import { getServicesApi } from '../../api/serviceApi';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getUpcomingDates = (days = 14) => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < days; i += 1) {
    const current = new Date(today);
    current.setDate(today.getDate() + i);
    const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = current.toLocaleDateString('en-US', { month: 'short' });
    dates.push({
      value: current.toISOString().split('T')[0],
      day: dayName,
      dayNumber: current.getDate(),
      month: monthName,
    });
  }

  return dates;
};

const formatLkr = (value) => (
  value !== undefined && value !== null
    ? `LKR ${Number(value).toLocaleString()}`
    : 'LKR 0'
);

const AppointmentBookingScreen = ({ route, navigation }) => {
  const { doctor } = route.params;
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getTodayDate());
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const availableDates = getUpcomingDates(14);
  const availableTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ];

  useEffect(() => {
    (async () => {
      try {
        const res = await getServicesApi();
        setServices(Array.isArray(res.data) ? res.data : []);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d));
  const isValidTime = (t) => /^\d{2}:\d{2}$/.test(String(t));

  const handleBook = async () => {
    if (!doctor?._id) { Alert.alert('Error', 'Doctor info missing'); return; }
    if (!selectedServiceId || !appointmentDate || !appointmentTime) { Alert.alert('Error', 'Please fill all required fields'); return; }
    if (!isValidDate(appointmentDate)) { Alert.alert('Error', 'Date must be YYYY-MM-DD'); return; }
    if (!isValidTime(appointmentTime)) { Alert.alert('Error', 'Time must be HH:MM'); return; }

    setLoading(true);
    try {
      await createAppointmentApi({ doctorId: doctor._id, serviceId: selectedServiceId, appointmentDate, appointmentTime, notes });
      Alert.alert(
        'Appointment Booked',
        'Your appointment has been successfully scheduled.',
        [{ text: 'OK', onPress: () => navigation.navigate('Tabs', { screen: 'Appointments' }) }]
      );
    } catch (error) {
      const message = error.response?.data?.message
        || (error.request ? 'Cannot reach the server. Check your backend URL and Wi-Fi connection.' : error.message)
        || 'Please try again.';

      console.error('Booking failed:', {
        status: error.response?.status,
        message,
        data: error.response?.data,
      });

      Alert.alert('Booking Failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Booking appointment..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Book Appointment"
        subtitle={`with ${doctor.name}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Doctor summary */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorAvatarText}>{doctor.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.doctorText}>
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
            <Text style={styles.doctorFee}>{formatLkr(doctor.consultationFee)} consultation</Text>
          </View>
        </View>

        {/* Service selection */}
        <Text style={styles.sectionLabel}>SELECT SERVICE</Text>
        {services.length === 0 ? (
          <Text style={styles.noServices}>No services available</Text>
        ) : (
          services.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={[styles.serviceItem, selectedServiceId === item._id && styles.serviceItemSelected]}
              onPress={() => setSelectedServiceId(item._id)}
              activeOpacity={0.8}
            >
              <View style={styles.serviceLeft}>
                <View style={[styles.radio, selectedServiceId === item._id && styles.radioSelected]}>
                  {selectedServiceId === item._id ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.serviceRadioRight}>
                  <Text style={[styles.serviceName, selectedServiceId === item._id && styles.serviceNameSelected]}>
                    {item.serviceName}
                  </Text>
                  <Text style={styles.serviceMeta}>{item.duration} min</Text>
                </View>
              </View>
              <Text style={[styles.servicePrice, selectedServiceId === item._id && styles.servicePriceSelected]}>
                {formatLkr(item.price)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionLabel}>CHOOSE DATE</Text>
        <View style={styles.calendarCard}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarRow}>
            {availableDates.map((date) => {
              const selected = date.value === appointmentDate;
              return (
                <TouchableOpacity
                  key={date.value}
                  style={[styles.dateItem, selected && styles.dateItemSelected]}
                  onPress={() => setAppointmentDate(date.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateDay, selected && styles.dateDaySelected]}>{date.day}</Text>
                  <Text style={[styles.dateNumber, selected && styles.dateNumberSelected]}>{date.dayNumber}</Text>
                  <Text style={[styles.dateMonth, selected && styles.dateMonthSelected]}>{date.month}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <Text style={styles.sectionLabel}>SELECT TIME SLOT</Text>
        <View style={styles.slotCard}>
          {availableTimeSlots.map((slot) => {
            const selected = slot === appointmentTime;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotItem, selected && styles.slotItemSelected]}
                onPress={() => setAppointmentTime(slot)}
                activeOpacity={0.8}
              >
                <Text style={[styles.slotText, selected && styles.slotTextSelected]}>{slot}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <CustomInput label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any special instructions..." multiline numberOfLines={3} />
        </View>

        <CustomButton title="Confirm Booking" onPress={handleBook} style={styles.bookBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 10, marginLeft: 4, marginTop: 8 },

  doctorCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 20, ...SHADOW.card,
  },
  doctorText: { marginLeft: 14 },
  doctorAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.tealBright, alignItems: 'center', justifyContent: 'center',
  },
  doctorAvatarText: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.white },
  doctorName: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  doctorSpec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  doctorFee: { fontSize: 12, color: COLORS.tealStrong, marginTop: 2, fontWeight: FONTS.semibold },

  serviceItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    borderWidth: 1.5, borderColor: COLORS.divider,
    padding: 14, marginVertical: 4, ...SHADOW.card,
  },
  serviceItemSelected: { borderColor: COLORS.tealStrong, backgroundColor: COLORS.tealFaint },
  serviceLeft: { flexDirection: 'row', alignItems: 'center' },
  serviceRadioRight: { marginLeft: 12 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.tealPale,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.tealStrong },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.tealStrong },
  serviceName: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.navyDeep },
  serviceNameSelected: { color: COLORS.tealStrong },
  serviceMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  servicePrice: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.textMuted },
  servicePriceSelected: { color: COLORS.tealStrong },
  noServices: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 16 },

  calendarCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
    ...SHADOW.card,
  },
  calendarRow: { paddingVertical: 2 },
  dateItem: {
    width: 80,
    minHeight: 100,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgMuted,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  dateItemSelected: {
    backgroundColor: COLORS.tealStrong,
  },
  dateDay: { fontSize: 11, fontWeight: FONTS.bold, color: COLORS.textSecondary, textTransform: 'uppercase' },
  dateDaySelected: { color: COLORS.white },
  dateNumber: { fontSize: 18, fontWeight: FONTS.bold, color: COLORS.navyDeep, marginTop: 6 },
  dateNumberSelected: { color: COLORS.white },
  dateMonth: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  dateMonthSelected: { color: COLORS.white },

  slotCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    ...SHADOW.card,
  },
  slotItem: {
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgMuted,
    paddingVertical: 10,
    paddingHorizontal: 14,
    margin: 4,
  },
  slotItemSelected: {
    backgroundColor: COLORS.tealStrong,
  },
  slotText: { color: COLORS.textPrimary, fontWeight: FONTS.medium },
  slotTextSelected: { color: COLORS.white },

  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  bookBtn: { marginTop: 8 },
});

export default AppointmentBookingScreen;
