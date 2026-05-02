import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  deleteUserApi,
  getUsersApi,
  permanentlyDeleteUserApi,
  reactivateUserApi,
} from '../../api/userApi';
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

const buildPermanentDeleteErrorMessage = (error) => {
  const fallback = error.response?.data?.message || 'Could not permanently delete this patient';
  const linked = error.response?.data?.data;

  if (!linked || typeof linked !== 'object') {
    return fallback;
  }

  const labels = [
    ['appointmentCount', 'appointments'],
    ['paymentCount', 'payments'],
    ['complaintCount', 'complaints'],
    ['medicalDocumentCount', 'medical documents'],
  ]
    .filter(([key]) => Number(linked[key]) > 0)
    .map(([key, label]) => `${linked[key]} ${label}`);

  if (labels.length === 0) {
    return fallback;
  }

  return `${fallback}. Linked records: ${labels.join(', ')}.`;
};

const UserCard = ({
  user,
  isCurrentUser,
  disabled,
  onDelete,
  onReactivate,
  isPatientView,
  onPress,
}) => {
  const rc = roleColor(user.role);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardPressArea}
        onPress={() => onPress?.(user)}
        activeOpacity={isPatientView ? 0.8 : 1}
        disabled={!onPress}
      >
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
      </TouchableOpacity>
      <View style={styles.actionColumn}>
        {user.isActive === false ? (
          <TouchableOpacity
            style={[styles.reactivateBtn, disabled && styles.disabledBtn]}
            onPress={() => onReactivate(user)}
            disabled={disabled}
            activeOpacity={0.8}
          >
            <Text style={styles.reactivateBtnText}>Reactivate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.deleteBtn, (disabled || isCurrentUser) && styles.disabledBtn]}
            onPress={() => onDelete(user)}
            disabled={disabled || isCurrentUser}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const UserListScreen = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const { userInfo } = useContext(AuthContext);
  const roleFilter = route?.params?.role || null;
  const isPatientView = roleFilter === 'patient';

  const visibleUsers = useMemo(
    () => (roleFilter ? users.filter((user) => user.role === roleFilter) : users),
    [roleFilter, users]
  );

  const activeCount = useMemo(
    () => visibleUsers.filter((user) => user.isActive !== false).length,
    [visibleUsers]
  );

  const inactiveCount = useMemo(
    () => visibleUsers.filter((user) => user.isActive === false).length,
    [visibleUsers]
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersApi({ includeInactive: true });
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
    Keyboard.dismiss();
    setPendingDeleteUser(user);
    setDeleteReason('');
  };

  const closeDeleteModal = useCallback(() => {
    Keyboard.dismiss();
    setPendingDeleteUser(null);
    setDeleteReason('');
  }, []);

  const confirmDeleteUser = async () => {
    if (!pendingDeleteUser) {
      return;
    }

    const normalizedReason = deleteReason.trim();
    if (!normalizedReason) {
      Alert.alert('Reason Required', 'Please enter a reason before deactivating this account.');
      return;
    }

    try {
      setActionLoadingId(pendingDeleteUser._id);
      await deleteUserApi(pendingDeleteUser._id, normalizedReason);
      await loadUsers();
      closeDeleteModal();
      Alert.alert('Success', 'User deactivated successfully');
    } catch (error) {
      Alert.alert('Delete Failed', error.response?.data?.message || 'Could not delete user');
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmPermanentDeleteUser = () => {
    if (!pendingDeleteUser) {
      return;
    }

    Alert.alert(
      'Permanent Delete',
      `Permanently delete ${pendingDeleteUser.name || pendingDeleteUser.email}? This cannot be undone and only works when the patient has no linked appointments, payments, complaints, or medical documents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(pendingDeleteUser._id);
              await permanentlyDeleteUserApi(pendingDeleteUser._id);
              await loadUsers();
              closeDeleteModal();
              Alert.alert('Success', 'Patient permanently deleted successfully');
            } catch (error) {
              Alert.alert(
                'Permanent Delete Failed',
                buildPermanentDeleteErrorMessage(error)
              );
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleReactivateUser = (user) => {
    Alert.alert(
      'Reactivate User',
      `Reactivate ${user.name || user.email}? They will be able to sign in again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            try {
              setActionLoadingId(user._id);
              await reactivateUserApi(user._id);
              await loadUsers();
              Alert.alert('Success', 'User reactivated successfully');
            } catch (error) {
              Alert.alert(
                'Reactivate Failed',
                error.response?.data?.message || 'Could not reactivate user'
              );
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
        subtitle={
          isPatientView
            ? `${activeCount} active, ${inactiveCount} inactive patients`
            : `${activeCount} active, ${inactiveCount} inactive accounts`
        }
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
            onReactivate={handleReactivateUser}
            isPatientView={isPatientView}
            onPress={isPatientView ? (user) => navigation.navigate('PatientDetails', {
              patientId: user._id,
              patient: user,
            }) : null}
          />
        )}
      />

      <Modal
        visible={Boolean(pendingDeleteUser)}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => {
          if (!actionLoadingId) {
            closeDeleteModal();
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 28 : 0}
        >
          <Pressable style={styles.modalBackdrop} onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
            >
              <Pressable style={styles.modalCard} onPress={() => {}}>
                <Text style={styles.modalTitle}>Deactivate User</Text>
                <Text style={styles.modalText}>
                  {`Add a reason for deactivating ${pendingDeleteUser?.name || pendingDeleteUser?.email}. This message will be shown if they try to log in.`}
                </Text>
                {pendingDeleteUser?.role === 'patient' ? (
                  <Text style={styles.modalWarningText}>
                    Permanent delete is only allowed when this patient has no linked appointments, payments, complaints, or medical documents.
                  </Text>
                ) : null}
                <TextInput
                  style={styles.reasonInput}
                  value={deleteReason}
                  onChangeText={setDeleteReason}
                  placeholder="Reason for deactivation"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!actionLoadingId}
                  maxLength={500}
                  returnKeyType="done"
                  blurOnSubmit
                  onSubmitEditing={Keyboard.dismiss}
                />
                <View style={styles.modalActions}>
                  {pendingDeleteUser?.role === 'patient' ? (
                    <TouchableOpacity
                      style={[styles.permanentBtn, actionLoadingId && styles.disabledBtn]}
                      onPress={confirmPermanentDeleteUser}
                      disabled={Boolean(actionLoadingId)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.permanentBtnText}>
                        {actionLoadingId ? 'Saving...' : 'Permanent Delete'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      if (!actionLoadingId) {
                        closeDeleteModal();
                      }
                    }}
                    disabled={Boolean(actionLoadingId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmBtn, actionLoadingId && styles.disabledBtn]}
                    onPress={confirmDeleteUser}
                    disabled={Boolean(actionLoadingId)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmBtnText}>
                      {actionLoadingId ? 'Saving...' : 'Deactivate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
  cardPressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  actionColumn: {
    marginLeft: 8,
  },
  reactivateBtn: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  reactivateBtnText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  disabledBtn: { opacity: 0.45 },
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 18,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    ...SHADOW.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
  },
  modalText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  modalWarningText: {
    fontSize: 12,
    color: COLORS.warning,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: FONTS.semibold,
  },
  reasonInput: {
    minHeight: 108,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.navyDeep,
    backgroundColor: COLORS.bgPage,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgMuted,
  },
  cancelBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: FONTS.bold,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.danger,
  },
  confirmBtnText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
  permanentBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.navyDeep,
  },
  permanentBtnText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: FONTS.bold,
  },
});

export default UserListScreen;
