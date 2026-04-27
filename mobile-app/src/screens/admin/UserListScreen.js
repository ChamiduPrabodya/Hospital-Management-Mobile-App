import React, { useCallback, useContext, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteUserApi, getUsersApi } from '../../api/userApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const roleColor = (role) => {
  if (role === 'admin') return { bg: COLORS.dangerBg, text: COLORS.danger };
  if (role === 'doctor') return { bg: COLORS.tealFaint, text: COLORS.tealStrong };
  return { bg: '#FEF3C7', text: COLORS.warning };
};

const UserCard = ({ user, isCurrentUser, disabled, onDelete, isPatientView }) => {
  const rc = roleColor(user.role);

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || 'U'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.name || 'Unnamed user'}</Text>
        <Text style={styles.email}>{user.email || 'No email'}</Text>
        {isPatientView ? (
          <>
            <Text style={styles.detailText}>{user.phone || 'No phone number'}</Text>
            <Text style={styles.detailText} numberOfLines={1}>
              {user.address || 'No address'}
            </Text>
          </>
        ) : null}
        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
            <Text style={[styles.roleText, { color: rc.text }]}>{user.role || 'patient'}</Text>
          </View>
          {isPatientView ? (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{user.isActive === false ? 'Inactive' : 'Active'}</Text>
            </View>
          ) : null}
          {isCurrentUser ? <Text style={styles.currentText}>Current admin</Text> : null}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.deleteBtn, (disabled || isCurrentUser) && styles.disabledBtn]}
        onPress={() => onDelete(user)}
        disabled={disabled || isCurrentUser}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteBtnText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
};

const UserListScreen = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { userInfo } = useContext(AuthContext);
  const roleFilter = route?.params?.role || null;
  const isPatientView = roleFilter === 'patient';

  const visibleUsers = useMemo(
    () => (roleFilter ? users.filter((user) => user.role === roleFilter) : users),
    [roleFilter, users]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersApi();
      const userData = Array.isArray(res.data) ? res.data : res.data?.data;
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (error) {
      console.error('Failed to load users:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleDeleteUser = (user) => {
    Alert.alert(
      'Delete User',
      `Deactivate ${user.name || user.email}? The account will no longer be able to log in.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(user._id);
              await deleteUserApi(user._id);
              setUsers((prev) => prev.filter((u) => u._id !== user._id));
            } catch (error) {
              Alert.alert('Delete Failed', error.response?.data?.message || 'Could not delete user');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && visibleUsers.length === 0) {
    return <LoadingSpinner message={isPatientView ? 'Loading patients...' : 'Loading users...'} />;
  }

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={isPatientView ? 'Patients' : 'Users'}
        subtitle={isPatientView ? `${visibleUsers.length} active patients` : `${visibleUsers.length} active accounts`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={visibleUsers}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadUsers}
        ListEmptyComponent={<EmptyState message={isPatientView ? 'No patients found' : 'No users found'} />}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            isCurrentUser={item._id === userInfo?._id}
            disabled={actionLoadingId === item._id}
            onDelete={handleDeleteUser}
            isPatientView={isPatientView}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginVertical: 6,
    ...SHADOW.card,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.tealFaint,
    marginRight: 12,
  },
  avatarText: { color: COLORS.tealStrong, fontWeight: FONTS.bold, fontSize: 16 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: FONTS.bold, color: COLORS.navyDeep },
  email: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  detailText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  roleText: { fontSize: 10, fontWeight: FONTS.bold, textTransform: 'capitalize' },
  statusBadge: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.success },
  currentText: { fontSize: 10, color: COLORS.textMuted, fontWeight: FONTS.semibold },
  deleteBtn: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginLeft: 8,
  },
  deleteBtnText: { color: COLORS.danger, fontSize: 11, fontWeight: FONTS.bold },
  disabledBtn: { opacity: 0.45 },
});

export default UserListScreen;
