import React, { useCallback, useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAppointmentsApi } from '../../api/appointmentApi';
import { getDoctorByIdApi } from '../../api/doctorApi';
import AppointmentCard from '../../components/AppointmentCard';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const PATIENT_CARDS = [
  { key: 'Doctors', label: 'Browse Doctors', sub: 'Find specialists', code: 'DOC' },
  { key: 'Appointments', label: 'My Appointments', sub: 'View and manage', code: 'APT' },
  { key: 'Complaints', label: 'My Complaints', sub: 'Track submissions', code: 'CMP' },
];

const DOCTOR_CARDS = [
  { key: 'Appointments', label: 'My Schedule', sub: 'Assigned appointments', code: 'APT' },
  { key: 'Profile', label: 'My Profile', sub: 'View account details', code: 'ME' },
];

const ADMIN_CARDS = [
  { key: 'Admin', label: 'Admin Dashboard', sub: 'Manage operations', code: 'ADM' },
  { key: 'Appointments', label: 'Appointments', sub: 'Review bookings', code: 'APT' },
  { key: 'Reports', label: 'Reports', sub: 'Generate and view', code: 'RPT' },
];

const roleContent = (role) => {
  if (role === 'doctor') {
    return {
      title: 'Doctor Dashboard',
      sub: 'Review your assigned appointments.',
      cards: DOCTOR_CARDS,
      stats: [
        { value: 'Today', label: 'Schedule' },
        { value: 'Live', label: 'Updates' },
        { value: 'Care', label: 'Notes' },
      ],
    };
  }

  if (role === 'admin') {
    return {
      title: 'Admin Workspace',
      sub: 'Manage hospital operations.',
      cards: ADMIN_CARDS,
      stats: [
        { value: 'Admin', label: 'Access' },
        { value: 'Live', label: 'Data' },
        { value: 'Secure', label: 'System' },
      ],
    };
  }

  return {
    title: 'Patient Portal',
    sub: 'How can we help you today?',
    cards: PATIENT_CARDS,
    stats: [
      { value: '24/7', label: 'Support' },
      { value: '50+', label: 'Specialists' },
      { value: '10K+', label: 'Patients' },
    ],
  };
};

const QuickCard = ({ item, onPress }) => (
  <TouchableOpacity style={styles.navCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.navIconBox}>
      <Text style={styles.navCode}>{item.code}</Text>
    </View>
    <View style={styles.navText}>
      <Text style={styles.navLabel}>{item.label}</Text>
      <Text style={styles.navSub}>{item.sub}</Text>
    </View>
    <View style={styles.chevron}><View style={styles.chevronInner} /></View>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const role = userInfo?.role || 'patient';
  const content = roleContent(role);
  const isDoctor = role === 'doctor';
  const isPatient = role === 'patient';
  const doctorProfileId = userInfo?.doctorProfileId?._id || userInfo?.doctorProfileId;

  const loadDoctorAppointments = useCallback(async () => {
    if (!isDoctor) return;
    try {
      const res = await getAppointmentsApi();
      const appointmentData = Array.isArray(res.data) ? res.data : res.data?.data;
      const sortedAppointments = (Array.isArray(appointmentData) ? appointmentData : [])
        .slice()
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
      setDoctorAppointments(sortedAppointments);
    } catch (error) {
      console.error('Failed to load doctor dashboard appointments:', error.response?.data || error.message);
    }
  }, [isDoctor]);

  const loadDoctorProfile = useCallback(async () => {
    if (!isDoctor || !doctorProfileId) return;
    try {
      const res = await getDoctorByIdApi(doctorProfileId);
      const profile = res.data?.data || res.data;
      if (profile?._id) setDoctorProfile(profile);
    } catch (error) {
      console.error('Failed to load doctor dashboard profile:', error.response?.data || error.message);
    }
  }, [doctorProfileId, isDoctor]);

  useFocusEffect(
    useCallback(() => {
      loadDoctorAppointments();
      loadDoctorProfile();
    }, [loadDoctorAppointments, loadDoctorProfile])
  );

  const pendingCount = doctorAppointments.filter((item) => item.status === 'pending').length;
  const recentAppointments = doctorAppointments.slice(0, 3);

  const handleQuickAccessPress = (target) => {
    // Route tab switches through the parent stack so shortcuts always land on the tab screen.
    navigation.getParent()?.navigate('Tabs', { screen: target });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={styles.crossWrap} pointerEvents="none">
          <View style={styles.crossV} /><View style={styles.crossH} />
        </View>
        {isPatient ? (
          <TouchableOpacity
            style={styles.makeAppointmentBtn}
            onPress={() => navigation.navigate('Appointments')}
            activeOpacity={0.86}
          >
            <Text style={styles.makeAppointmentText}>Make Appointment</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.heroEst}>VICTORIA HOSPITAL</Text>
        <Text style={styles.heroGreet}>Good day,</Text>
        <Text style={styles.heroName}>{userInfo?.name || 'User'}</Text>
        <View style={styles.heroAccent} />
        <Text style={styles.heroSub}>{content.title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statRow}>
          {content.stats.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 ? <View style={styles.statDivider} /> : null}
              <View style={styles.statPill}>
                <Text style={styles.statVal}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
        <Text style={styles.sectionSub}>{content.sub}</Text>

        {content.cards.map((item) => (
          <QuickCard key={item.key} item={item} onPress={() => handleQuickAccessPress(item.key)} />
        ))}

        {isDoctor ? (
          <View style={styles.dashboardSection}>
            {doctorProfile ? (
              <TouchableOpacity
                style={styles.doctorProfileCard}
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.86}
              >
                {doctorProfile.image ? (
                  <Image source={{ uri: doctorProfile.image }} style={styles.doctorProfileImage} resizeMode="cover" />
                ) : (
                  <View style={styles.doctorProfilePlaceholder}>
                    <Text style={styles.doctorProfileInitial}>{doctorProfile.name?.charAt(0)?.toUpperCase() || 'D'}</Text>
                  </View>
                )}
                <View style={styles.doctorProfileText}>
                  <Text style={styles.doctorProfileName}>{doctorProfile.name || userInfo?.name || 'Doctor'}</Text>
                  <Text style={styles.doctorProfileSpec}>{doctorProfile.specialization || 'Specialization N/A'}</Text>
                  <Text style={styles.doctorProfileMeta}>
                    {doctorProfile.experience ?? 'N/A'} yrs exp | {doctorProfile.consultationFee !== undefined && doctorProfile.consultationFee !== null
                      ? `LKR ${Number(doctorProfile.consultationFee).toLocaleString()}`
                      : 'Fee N/A'}
                  </Text>
                </View>
                <View style={[
                  styles.doctorStatusBadge,
                  { backgroundColor: doctorProfile.availabilityStatus ? COLORS.successBg : COLORS.dangerBg },
                ]}>
                  <Text style={[
                    styles.doctorStatusText,
                    { color: doctorProfile.availabilityStatus ? COLORS.success : COLORS.danger },
                  ]}>
                    {doctorProfile.availabilityStatus ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <View style={styles.previewHeader}>
              <View>
                <Text style={styles.sectionTitleInline}>ASSIGNED BOOKINGS</Text>
                <Text style={styles.sectionSubInline}>
                  {pendingCount} pending, {doctorAppointments.length} total
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
                viewerRole={role}
                onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
              />
            )) : (
              <Text style={styles.emptyPreviewText}>No assigned patient bookings yet.</Text>
            )}
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
    paddingBottom: 36,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.04)', top: -60, right: -70 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -30, left: -40 },
  crossWrap: { position: 'absolute', right: 20, bottom: 16, width: 70, height: 70, alignItems: 'center', justifyContent: 'center', opacity: 0.1 },
  crossV: { position: 'absolute', width: 16, height: 60, backgroundColor: COLORS.white, borderRadius: 3 },
  crossH: { position: 'absolute', width: 60, height: 16, backgroundColor: COLORS.white, borderRadius: 3 },
  makeAppointmentBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 38,
    right: 16,
    minHeight: 36,
    maxWidth: 150,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.tealStrong,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.btn,
  },
  makeAppointmentText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },

  heroEst: { fontSize: 9, letterSpacing: 2.2, color: 'rgba(255,255,255,0.45)', marginBottom: 12 },
  heroGreet: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: FONTS.regular },
  heroName: { fontSize: 26, fontWeight: FONTS.bold, color: COLORS.white, marginTop: 2 },
  heroAccent: { width: 40, height: 3, backgroundColor: COLORS.tealLight, borderRadius: 2, marginVertical: 12 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 40 },

  statRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    ...SHADOW.card,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statPill: { alignItems: 'center', flex: 1 },
  statVal: { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: FONTS.medium },
  statDivider: { width: 1, height: 32, backgroundColor: COLORS.divider },

  sectionTitle: {
    fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright,
    letterSpacing: 2, marginLeft: 20, marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 20,
    marginBottom: 10,
  },

  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 5,
    ...SHADOW.card,
  },
  navIconBox: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  navCode: { fontSize: 11, color: COLORS.tealStrong, fontWeight: FONTS.bold },
  navText: { flex: 1 },
  navLabel: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  navSub: { fontSize: 12, fontWeight: FONTS.regular, color: COLORS.textMuted, marginTop: 2 },
  chevron: { paddingLeft: 8 },
  chevronInner: { width: 8, height: 8, borderRightWidth: 2, borderTopWidth: 2, borderColor: COLORS.tealPale, transform: [{ rotate: '45deg' }] },

  dashboardSection: { marginTop: 20 },
  doctorProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 18,
    ...SHADOW.card,
  },
  doctorProfileImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.bgMuted,
  },
  doctorProfilePlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorProfileInitial: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
  },
  doctorProfileText: { flex: 1, marginLeft: 12 },
  doctorProfileName: { fontSize: 15, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  doctorProfileSpec: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  doctorProfileMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  doctorStatusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  doctorStatusText: { fontSize: 10, fontWeight: FONTS.bold },
  previewHeader: {
    marginHorizontal: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleInline: {
    fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright,
    letterSpacing: 2, marginBottom: 4,
  },
  sectionSubInline: { fontSize: 12, color: COLORS.textMuted },
  viewAllText: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.tealStrong },
  emptyPreviewText: {
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    color: COLORS.textMuted,
    ...SHADOW.card,
  },

});

export default HomeScreen;
