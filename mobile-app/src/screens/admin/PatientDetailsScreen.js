import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUserByIdApi } from '../../api/userApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const DetailRow = ({ label, value, valueStyle }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueStyle]}>{value}</Text>
  </View>
);

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const PatientDetailsScreen = ({ route, navigation }) => {
  const [patient, setPatient] = useState(route.params?.patient || null);
  const [loading, setLoading] = useState(false);

  const loadPatient = useCallback(async () => {
    const patientId = route.params?.patientId || patient?._id;
    if (!patientId) return;

    setLoading(true);
    try {
      const res = await getUserByIdApi(patientId);
      const freshPatient = res.data?.data || res.data;
      if (freshPatient?._id) {
        setPatient(freshPatient);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  }, [patient?._id, route.params?.patientId]);

  useFocusEffect(
    useCallback(() => {
      loadPatient();
    }, [loadPatient])
  );

  if (loading && !patient) {
    return <LoadingSpinner message="Loading patient details..." />;
  }

  const patientName = patient?.name || 'Patient';
  const initials = patientName
    .split(' ')
    .map((part) => part?.[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyMid} />
      <ScreenHeader
        title="Patient Details"
        subtitle={patient?.email || 'Patient profile overview'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          {patient?.profileImage ? (
            <Image source={{ uri: patient.profileImage }} style={styles.profileImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials || 'P'}</Text>
            </View>
          )}

          <Text style={styles.name}>{patientName}</Text>
          <Text style={styles.email}>{patient?.email || 'No email address'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{patient?.role || 'patient'}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: patient?.isActive === false ? COLORS.dangerBg : COLORS.successBg },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: patient?.isActive === false ? COLORS.danger : COLORS.success },
                ]}
              >
                {patient?.isActive === false ? 'Inactive' : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.divider} />
          <DetailRow label="Phone" value={patient?.phone || 'No phone number'} />
          <View style={styles.divider} />
          <DetailRow label="Address" value={patient?.address || 'No address'} valueStyle={styles.multilineValue} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <View style={styles.divider} />
          <DetailRow label="User ID" value={patient?._id || 'N/A'} valueStyle={styles.compactValue} />
          <View style={styles.divider} />
          <DetailRow label="Registered" value={formatDate(patient?.createdAt)} />
          <View style={styles.divider} />
          <DetailRow label="Last Updated" value={formatDate(patient?.updatedAt)} />
          {patient?.deletedAt ? (
            <>
              <View style={styles.divider} />
              <DetailRow label="Deactivated" value={formatDate(patient.deletedAt)} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 18, paddingBottom: 40 },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    ...SHADOW.card,
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.bgMuted,
    marginBottom: 14,
  },
  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 36,
    color: COLORS.tealStrong,
    fontWeight: FONTS.bold,
  },
  name: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    textAlign: 'center',
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  roleText: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: FONTS.bold,
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    ...SHADOW.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    flex: 0.9,
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
    textTransform: 'uppercase',
  },
  detailValue: {
    flex: 1.5,
    marginLeft: 12,
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
    textAlign: 'right',
  },
  multilineValue: {
    lineHeight: 20,
  },
  compactValue: {
    fontSize: 12,
  },
});

export default PatientDetailsScreen;
