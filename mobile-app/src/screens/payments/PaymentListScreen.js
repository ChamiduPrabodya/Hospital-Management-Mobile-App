import React, { useState, useCallback, useContext } from 'react';
import { View, FlatList, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deletePaymentApi, getPaymentsApi } from '../../api/paymentApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW, statusColor } from '../../theme';

const PaymentCard = ({ item, isAdmin, onDelete, disabled }) => {
  const sc = statusColor(item.status);
  return (
    <View style={styles.card}>
      <View style={[styles.methodBadge, { backgroundColor: item.paymentMethod === 'card' ? COLORS.tealFaint : '#fff7ed' }]}>
        <Text style={styles.methodEmoji}>{item.paymentMethod === 'card' ? 'CARD' : 'CASH'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.amount}>LKR {Number(item.amount || 0).toLocaleString()}</Text>
        <Text style={styles.method}>{item.paymentMethod === 'card' ? 'Card Payment' : 'Cash Payment'}</Text>
        {item.appointmentId?.appointmentDate ? (
          <Text style={styles.appointment}>
            {new Date(item.appointmentId.appointmentDate).toLocaleDateString('en-GB')} at {item.appointmentId.appointmentTime}
          </Text>
        ) : null}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
        <Text style={[styles.statusText, { color: sc.text }]}>
          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
        </Text>
      </View>
      {isAdmin ? (
        <TouchableOpacity
          style={[styles.deleteBtn, disabled && styles.disabledBtn]}
          onPress={() => onDelete(item)}
          disabled={disabled}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const PaymentListScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPaymentsApi();
      const paymentData = Array.isArray(res.data) ? res.data : res.data?.data;
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments])
  );

  const handleDeletePayment = (payment) => {
    Alert.alert(
      'Delete Payment',
      `Delete this ${payment.status || ''} payment record? Completed payments cannot be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(payment._id);
              await deletePaymentApi(payment._id);
              setPayments((prev) => prev.filter((p) => p._id !== payment._id));
            } catch (error) {
              Alert.alert('Delete Failed', error.response?.data?.message || 'Could not delete payment');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && payments.length === 0) return <LoadingSpinner message="Loading payments..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader title="Payment History" subtitle={`${payments.length} transactions`} />
      <FlatList
        data={payments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadPayments}
        ListEmptyComponent={<EmptyState message="No payments found" subtitle="Your payment history will appear here" />}
        renderItem={({ item }) => (
          <PaymentCard
            item={item}
            isAdmin={isAdmin}
            onDelete={handleDeletePayment}
            disabled={actionLoadingId === item._id}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 30 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 14, marginVertical: 5, ...SHADOW.card, gap: 12,
  },
  methodBadge: {
    width: 46, height: 46, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  methodEmoji: { fontSize: 10, color: COLORS.tealStrong, fontWeight: FONTS.bold },
  info: { flex: 1 },
  amount: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  method: { fontSize: 12, fontWeight: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  appointment: { fontSize: 11, fontWeight: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: FONTS.bold },
  deleteBtn: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  deleteBtnText: { fontSize: 11, fontWeight: FONTS.bold, color: COLORS.danger },
  disabledBtn: { opacity: 0.55 },
});

export default PaymentListScreen;
