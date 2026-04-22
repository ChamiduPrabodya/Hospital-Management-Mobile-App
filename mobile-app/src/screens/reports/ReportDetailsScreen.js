import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReportByIdApi } from '../../api/reportApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatTile = ({ label, value, color = COLORS.navyDeep }) => (
  <View style={styles.statTile}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const AppointmentReport = ({ data }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Appointment Status</Text>
    <View style={styles.statGrid}>
      <StatTile label="Total" value={data.totalAppointments ?? 0} />
      <StatTile label="Approved" value={data.approvedCount ?? 0} color={COLORS.success} />
      <StatTile label="Pending" value={data.pendingCount ?? 0} color={COLORS.warning} />
      <StatTile label="Rejected" value={data.rejectedCount ?? 0} color={COLORS.danger} />
      <StatTile label="Cancelled" value={data.cancelledCount ?? 0} color={COLORS.textMuted} />
    </View>
  </View>
);

const RevenueReport = ({ data }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>Revenue Summary</Text>
    <View style={styles.statGrid}>
      <StatTile label="Completed Payments" value={data.totalCompletedPayments ?? 0} color={COLORS.success} />
      <StatTile
        label="Total Revenue"
        value={`LKR ${Number(data.totalRevenue || 0).toLocaleString()}`}
        color={COLORS.tealStrong}
      />
    </View>
  </View>
);

const DoctorPerformanceReport = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Doctor Performance</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyText}>No doctor appointment data available.</Text>
      ) : (
        rows.map((row, index) => (
          <View key={`${row.doctorId || row.doctorName || index}`} style={styles.doctorRow}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{row.doctorName || 'Unknown Doctor'}</Text>
              <Text style={styles.doctorSpec}>{row.specialization || 'Specialization N/A'}</Text>
            </View>
            <Text style={styles.doctorCount}>{row.appointmentCount ?? 0}</Text>
          </View>
        ))
      )}
    </View>
  );
};

const ReportData = ({ report }) => {
  const data = report.data || {};

  if (report.reportType === 'appointments') return <AppointmentReport data={data} />;
  if (report.reportType === 'revenue') return <RevenueReport data={data} />;
  if (report.reportType === 'doctor_performance') return <DoctorPerformanceReport data={data} />;

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Report Data</Text>
      <Text style={styles.emptyText}>Unsupported report type.</Text>
    </View>
  );
};

const ReportDetailsScreen = ({ route, navigation }) => {
  const [report, setReport] = useState(route.params.report);
  const [loading, setLoading] = useState(false);

  const loadReport = useCallback(async () => {
    if (!report?._id) return;
    setLoading(true);
    try {
      const res = await getReportByIdApi(report._id);
      const freshReport = res.data?.data || res.data;
      if (freshReport?._id) setReport(freshReport);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load report details');
    } finally {
      setLoading(false);
    }
  }, [report?._id]);

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  if (loading && !report) return <LoadingSpinner message="Loading report..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Report Details"
        subtitle={report.title || 'Generated report'}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.metaCard}>
          <Text style={styles.reportTitle}>{report.title || 'Report'}</Text>
          <DetailRow label="Type" value={titleCase(report.reportType)} />
          <DetailRow label="Generated" value={formatDateTime(report.createdAt)} />
          <DetailRow label="Generated by" value={report.generatedBy?.name || report.generatedBy?.email || 'Admin'} />
        </View>

        <ReportData report={report} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  metaCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    ...SHADOW.card,
  },
  reportTitle: {
    fontSize: 17,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: FONTS.medium },
  detailValue: { flex: 1, textAlign: 'right', fontSize: 12, color: COLORS.navyDeep, fontWeight: FONTS.semibold },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    ...SHADOW.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: COLORS.bgPage,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  statValue: { fontSize: 18, fontWeight: FONTS.bold },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealFaint,
    marginRight: 10,
  },
  rankText: { color: COLORS.tealStrong, fontWeight: FONTS.bold, fontSize: 12 },
  doctorInfo: { flex: 1 },
  doctorName: { fontSize: 13, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  doctorSpec: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  doctorCount: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.tealStrong },
  emptyText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
});

export default ReportDetailsScreen;
