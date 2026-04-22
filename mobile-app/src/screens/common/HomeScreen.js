import React, { useContext } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Platform,
} from 'react-native';
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
  const { userInfo, logout } = useContext(AuthContext);
  const role = userInfo?.role || 'patient';
  const content = roleContent(role);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={styles.crossWrap} pointerEvents="none">
          <View style={styles.crossV} /><View style={styles.crossH} />
        </View>
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
          <QuickCard key={item.key} item={item} onPress={() => navigation.navigate(item.key)} />
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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

  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    alignItems: 'center',
  },
  logoutText: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.danger },
});

export default HomeScreen;
