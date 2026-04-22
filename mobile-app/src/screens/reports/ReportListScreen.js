import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReportsApi } from '../../api/reportApi';
import ReportCard from '../../components/ReportCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS } from '../../theme';

const ReportListScreen = ({ navigation }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReportsApi();
      const reportData = Array.isArray(res.data) ? res.data : res.data?.data;
      setReports(Array.isArray(reportData) ? reportData : []);
    } catch (e) {
      console.error('Failed to load reports:', e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  if (loading && reports.length === 0) return <LoadingSpinner message="Loading reports..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Reports"
        subtitle={`${reports.length} reports generated`}
        rightAction={(
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => navigation.navigate('ReportGenerate')}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnText}>+ Generate</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadReports}
        ListEmptyComponent={
          <EmptyState message="No reports yet" subtitle="Generate your first report from the admin dashboard" />
        }
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => navigation.navigate('ReportDetails', { report: item })}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { paddingTop: 12, paddingBottom: 30 },
  newBtn: {
    backgroundColor: COLORS.tealBright,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  newBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
});

export default ReportListScreen;
