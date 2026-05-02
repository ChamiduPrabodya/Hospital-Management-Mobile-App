import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteDepartmentApi, getAllDepartments } from '../../api/departmentApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const DepartmentList = ({ navigation }) => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllDepartments();
      const data = Array.isArray(response.data) ? response.data : response.data?.data;
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      Alert.alert('Load Failed', error?.response?.data?.message || 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDepartments();
    }, [loadDepartments])
  );

  const handleDelete = (department) => {
    Alert.alert(
      'Delete Department',
      `Remove ${department.name} from the hospital directory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(department._id);
              await deleteDepartmentApi(department._id);
              setDepartments((current) => current.filter((item) => item._id !== department._id));
            } catch (error) {
              Alert.alert('Delete Failed', error?.response?.data?.message || 'Could not delete department.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && departments.length === 0) {
    return <LoadingSpinner message="Loading departments..." />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Departments"
        subtitle={`${departments.length} hospital wings configured`}
        onBack={() => navigation.goBack()}
        rightAction={(
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddDepartment')}
            activeOpacity={0.82}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={departments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadDepartments}
        ListEmptyComponent={<EmptyState message="No departments available yet" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>DPT</Text>
              </View>
              <View style={styles.titleWrap}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>

            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Contact</Text>
              <Text style={styles.metaValue}>{item.contactNumber || 'Not assigned'}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editPill}
                onPress={() => navigation.navigate('AddDepartment', { department: item })}
                disabled={actionLoadingId === item._id}
                activeOpacity={0.82}
              >
                <Text style={styles.editPillText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deletePill, actionLoadingId === item._id && styles.disabledPill]}
                onPress={() => handleDelete(item)}
                disabled={actionLoadingId === item._id}
                activeOpacity={0.82}
              >
                <Text style={styles.deletePillText}>
                  {actionLoadingId === item._id ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { padding: 16, paddingTop: 20, paddingBottom: 36 },
  addBtn: {
    backgroundColor: COLORS.tealBright,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 14,
    ...SHADOW.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  codeText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
    letterSpacing: 0.6,
  },
  titleWrap: { flex: 1 },
  name: { fontSize: 16, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  location: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  description: {
    marginTop: 14,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  metaRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    color: COLORS.tealBright,
    letterSpacing: 1.1,
  },
  metaValue: { fontSize: 13, color: COLORS.navyDeep, fontWeight: FONTS.medium },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
  },
  editPill: {
    backgroundColor: COLORS.tealFaint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  editPillText: {
    fontSize: 12,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
  },
  deletePill: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  deletePillText: {
    fontSize: 12,
    fontWeight: FONTS.bold,
    color: COLORS.danger,
  },
  disabledPill: { opacity: 0.55 },
});

export default DepartmentList;
