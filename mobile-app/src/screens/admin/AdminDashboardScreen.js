import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAppointmentsApi } from '../../api/appointmentApi';
import AppointmentCard from '../../components/AppointmentCard';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const ADMIN_CARDS = [
  { key: 'DoctorForm', label: 'Add Doctor', sub: 'Register new specialist', color: COLORS.tealFaint, accent: COLORS.tealBright },
  { key: 'ServiceForm', label: 'Add Service', sub: 'Create a new service', color: '#e6f7f0', accent: COLORS.success },
  { key: 'Reports', label: 'View Reports', sub: 'Browse all reports', color: '#fff7ed', accent: COLORS.warning },
  { key: 'ReportGenerate', label: 'Generate Report', sub: 'Create custom report', color: '#fef2f2', accent: COLORS.danger },
  { key: 'Appointments', label: 'Appointments', sub: 'Manage bookings', color: COLORS.tealFaint, accent: COLORS.tealStrong },
  { key: 'Complaints', label: 'Complaints', sub: 'Handle complaints', color: '#fff7ed', accent: COLORS.warning },
  { key: 'Users', label: 'Users', sub: 'Manage user accounts', color: COLORS.tealFaint, accent: COLORS.tealBright },
];

const AdminCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: COLORS.white }]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={[styles.cardAccentBar, { backgroundColor: item.accent }]} />
    <View style={styles.cardBody}>
      <Text style={styles.cardLabel}>{item.label}</Text>
      <Text style={styles.cardSub}>{item.sub}</Text>
    </View>
    <View style={[styles.cardIcon, { backgroundColor: item.color }]}>
      <View style={[styles.arrowR, { borderColor: item.accent }]} />
    </View>
  </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = useCallback(async () => {
    try {
      const res = await getAppointmentsApi();
      const appointmentData = Array.isArray(res.data) ? res.data : res.data?.data;
      const sortedAppointments = (Array.isArray(appointmentData) ? appointmentData : [])
        .slice()
        .sort((a, b) => new Date(b.createdAt || b.appointmentDate) - new Date(a.createdAt || a.appointmentDate));
      setAppointments(sortedAppointments);
    } catch (error) {
      console.error('Failed to load admin dashboard appointments:', error.response?.data || error.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const pendingCount = appointments.filter((item) => item.status === 'pending').length;
  const recentAppointments = appointments.slice(0, 3);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      <View style={styles.hero}>
        <View style={styles.circle1} /><View style={styles.circle2} />
        <Text style={styles.heroEst}>VICTORIA HOSPITAL</Text>
        <Text style={styles.heroTitle}>Admin Dashboard</Text>
        <View style={styles.accentBar} />
        <Text style={styles.heroSub}>Manage hospital operations</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        {ADMIN_CARDS.map((item) => (
          <AdminCard key={item.key} item={item} onPress={() => navigation.navigate(item.key)} />
        ))}

        <View style={styles.dashboardSection}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.sectionLabelInline}>RECENT BOOKINGS</Text>
              <Text style={styles.sectionSubInline}>
                {pendingCount} pending, {appointments.length} total
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')} activeOpacity={0.8}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {recentAppointments.length > 0 ? recentAppointments.map((item) => (
            <AppointmentCard
              key={item._id}
              appointment={item}
              viewerRole="admin"
              onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
            />
          )) : (
            <Text style={styles.emptyPreviewText}>No patient bookings yet.</Text>
          )}
        </View>
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
    paddingBottom: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -60 },
  circle2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30 },
  heroEst: { fontSize: 9, letterSpacing: 2.2, color: 'rgba(255,255,255,0.45)', marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: FONTS.bold, color: COLORS.white },
  accentBar: { width: 40, height: 3, backgroundColor: COLORS.tealLight, borderRadius: 2, marginVertical: 10 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    marginVertical: 5,
    overflow: 'hidden',
    ...SHADOW.card,
  },
  cardAccentBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 16 },
  cardLabel: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  cardSub: { fontSize: 12, fontWeight: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  cardIcon: { width: 40, height: 40, borderRadius: RADIUS.md, marginRight: 14, alignItems: 'center', justifyContent: 'center' },
  arrowR: { width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, transform: [{ rotate: '45deg' }] },

  dashboardSection: { marginTop: 22 },
  previewHeader: {
    marginHorizontal: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabelInline: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 4 },
  sectionSubInline: { fontSize: 12, color: COLORS.textMuted },
  viewAllText: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.tealStrong },
  emptyPreviewText: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    color: COLORS.textMuted,
    ...SHADOW.card,
  },
});

export default AdminDashboardScreen;
