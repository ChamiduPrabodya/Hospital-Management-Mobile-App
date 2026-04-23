import React, { useState, useCallback, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAppointmentsApi, updateAppointmentStatusApi } from '../../api/appointmentApi';
import AppointmentCard from '../../components/AppointmentCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const AppointmentListScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';
  const isDoctor = userInfo?.role === 'doctor';

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointmentsApi();
      const appointmentData = Array.isArray(res.data) ? res.data : res.data?.data;
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (error) {
      console.error('Failed to load appointments:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const handleStatusChange = async (id, nextStatus) => {
    setActionLoadingId(id);
    try {
      await updateAppointmentStatusApi(id, nextStatus);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: nextStatus } : a))
      );
      Alert.alert('Updated', `Appointment ${nextStatus}`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading && appointments.length === 0) return <LoadingSpinner message="Loading appointments..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={isDoctor ? 'My Schedule' : 'Appointments'}
        subtitle={`${appointments.length} total`}
      />

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadAppointments}
        ListEmptyComponent={
          <EmptyState
            message={isDoctor ? 'No assigned appointments' : 'No appointments found'}
            subtitle={isDoctor ? 'Assigned patient bookings will appear here' : 'Book your first appointment with a specialist'}
          />
        }
        renderItem={({ item }) => (
          <View>
            <AppointmentCard
              appointment={item}
              viewerRole={userInfo?.role}
              onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
            />
            {isAdmin && item.status === 'pending' ? (
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnLeft, styles.approveBtn]}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                  onPress={() => handleStatusChange(item._id, 'approved')}
                >
                  <Text style={styles.actionBtnText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                  onPress={() => handleStatusChange(item._id, 'rejected')}
                >
                  <Text style={styles.actionBtnText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { paddingTop: 12, paddingBottom: 30 },
  adminActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  actionBtnLeft: { marginRight: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.danger },
  actionBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
});

export default AppointmentListScreen;
