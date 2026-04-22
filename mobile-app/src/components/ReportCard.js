import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../theme';

const typeIcon = (type) => {
  switch (type) {
    case 'appointments': return { label: 'APT', bg: COLORS.tealFaint, text: COLORS.tealStrong };
    case 'revenue': return { label: 'REV', bg: '#e6f7f0', text: COLORS.success };
    case 'doctor_performance': return { label: 'DOC', bg: '#fff7ed', text: COLORS.warning };
    default: return { label: 'RPT', bg: COLORS.bgMuted, text: COLORS.textMuted };
  }
};

const titleCase = (value = '') => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value) => {
  if (!value) return 'Date N/A';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const buildSummary = (report) => {
  const data = report.data || {};

  if (report.reportType === 'appointments') {
    return [
      { label: 'Total', value: data.totalAppointments ?? 0 },
      { label: 'Approved', value: data.approvedCount ?? 0 },
      { label: 'Pending', value: data.pendingCount ?? 0 },
      { label: 'Rejected', value: data.rejectedCount ?? 0 },
      { label: 'Cancelled', value: data.cancelledCount ?? 0 },
    ];
  }

  if (report.reportType === 'revenue') {
    return [
      { label: 'Payments', value: data.totalCompletedPayments ?? 0 },
      { label: 'Revenue', value: `LKR ${Number(data.totalRevenue || 0).toLocaleString()}` },
    ];
  }

  if (report.reportType === 'doctor_performance') {
    const rows = Array.isArray(data) ? data : [];
    return rows.slice(0, 3).map((row) => ({
      label: row.doctorName || 'Unknown',
      value: row.appointmentCount ?? 0,
    }));
  }

  return [];
};

const ReportCard = ({ report, onPress }) => {
  const icon = typeIcon(report.reportType);
  const summary = buildSummary(report);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
          <Text style={[styles.iconText, { color: icon.text }]}>{icon.label}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{report.title || 'Report'}</Text>
          <Text style={styles.type}>{titleCase(report.reportType)}</Text>
          <Text style={styles.date}>Generated {formatDate(report.createdAt)}</Text>
        </View>
        <View style={styles.arrow}>
          <View style={styles.chevron} />
        </View>
      </View>

      {summary.length ? (
        <View style={styles.summaryGrid}>
          {summary.map((item) => (
            <View key={item.label} style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    ...SHADOW.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 13,
    fontWeight: FONTS.bold,
    letterSpacing: 1,
  },
  info: { flex: 1 },
  arrow: { paddingLeft: 10 },
  chevron: {
    width: 8,
    height: 8,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: COLORS.tealPale,
    transform: [{ rotate: '45deg' }],
  },
  title: {
    fontSize: 15,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    marginBottom: 3,
  },
  type: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  date: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  summaryItem: {
    minWidth: '46%',
    flexGrow: 1,
    backgroundColor: COLORS.bgPage,
    borderRadius: RADIUS.md,
    padding: 10,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

export default ReportCard;
