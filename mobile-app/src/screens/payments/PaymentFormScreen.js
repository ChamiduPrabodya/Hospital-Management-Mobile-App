import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { createPaymentApi } from '../../api/paymentApi';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const PAYMENT_METHODS = [
  { key: 'card', label: 'Credit / Debit Card', icon: 'CARD' },
  { key: 'cash', label: 'Cash Payment', icon: 'CASH' },
];

const PaymentFormScreen = ({ route, navigation }) => {
  const { appointmentId, appointment, amount: routeAmount } = route.params;
  const appointmentAmount = appointment?.serviceSnapshot?.price ?? appointment?.serviceId?.price ?? routeAmount ?? '';
  const [amount] = useState(appointmentAmount ? String(appointmentAmount) : '');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Payment amount is missing for this appointment.');
      return;
    }

    setLoading(true);
    try {
      await createPaymentApi({ appointmentId, amount: parsedAmount, paymentMethod });
      Alert.alert('Payment Successful', 'Your payment has been processed successfully.', [
        { text: 'Done', onPress: () => navigation.navigate('Tabs', { screen: 'Appointments' }) },
      ]);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Please try again.';

      if (status === 409) {
        Alert.alert('Payment Already Recorded', message, [
          { text: 'View Appointment', onPress: () => navigation.navigate('Tabs', { screen: 'Appointments' }) },
        ]);
        return;
      }

      Alert.alert('Payment Failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Processing payment..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Make Payment"
        subtitle="Secure hospital payment portal"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.secureBanner}>
          <Text style={styles.secureBannerIcon}>LOCK</Text>
          <Text style={styles.secureBannerText}>Secure hospital payment portal</Text>
        </View>

        {appointment ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Appointment Summary</Text>
            <Text style={styles.summaryText}>
              {appointment.doctorId?.name || 'Doctor'} - {appointment.serviceId?.serviceName || 'Service'}
            </Text>
            <Text style={styles.summaryText}>
              {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-GB') : 'Date N/A'} at {appointment.appointmentTime || 'Time N/A'}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>PAYMENT AMOUNT</Text>
        <View style={styles.formCard}>
          <CustomInput
            label="Amount (LKR)"
            value={amount}
            onChangeText={() => {}}
            placeholder="Appointment amount"
            keyboardType="numeric"
            editable={false}
          />
          <Text style={styles.amountHint}>Amount is filled from the selected appointment service.</Text>
        </View>

        <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
        <View style={styles.methodsCard}>
          {PAYMENT_METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.methodItem, paymentMethod === m.key && styles.methodItemSelected]}
              onPress={() => setPaymentMethod(m.key)}
              activeOpacity={0.8}
            >
              <Text style={styles.methodEmoji}>{m.icon}</Text>
              <Text style={[styles.methodLabel, paymentMethod === m.key && styles.methodLabelSelected]}>
                {m.label}
              </Text>
              <View style={[styles.radio, paymentMethod === m.key && styles.radioSelected]}>
                {paymentMethod === m.key ? <View style={styles.radioDot} /> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <CustomButton title={`Pay with ${paymentMethod === 'card' ? 'Card' : 'Cash'}`} onPress={handlePay} style={styles.payBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 10, marginLeft: 4, marginTop: 4 },

  secureBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.tealFaint, borderRadius: RADIUS.lg,
    padding: 14, marginBottom: 14,
  },
  secureBannerIcon: { fontSize: 11, color: COLORS.tealStrong, fontWeight: FONTS.bold },
  secureBannerText: { fontSize: 12, color: COLORS.tealStrong, fontWeight: FONTS.medium },

  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  summaryTitle: { fontSize: 13, fontWeight: FONTS.bold, color: COLORS.navyDeep, marginBottom: 6 },
  summaryText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  amountHint: { fontSize: 11, color: COLORS.textMuted, marginTop: -4 },
  methodsCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    overflow: 'hidden', marginBottom: 20, ...SHADOW.card,
  },
  methodItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  methodItemSelected: { backgroundColor: COLORS.tealFaint },
  methodEmoji: { width: 42, fontSize: 11, color: COLORS.tealStrong, fontWeight: FONTS.bold },
  methodLabel: { flex: 1, fontSize: 14, color: COLORS.textSecondary, fontWeight: FONTS.medium },
  methodLabelSelected: { color: COLORS.tealStrong, fontWeight: FONTS.bold },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.tealPale,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: COLORS.tealStrong },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.tealStrong },
  payBtn: { marginTop: 4 },
});

export default PaymentFormScreen;
