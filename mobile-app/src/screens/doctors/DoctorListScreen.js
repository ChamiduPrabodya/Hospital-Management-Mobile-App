import React, { useState, useCallback, useContext } from 'react';
import {
  View, FlatList, StyleSheet, Alert, TouchableOpacity, Text,
  Modal, Image, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteDoctorApi, getDoctorsApi, updateDoctorApi } from '../../api/doctorApi';
import DoctorCard from '../../components/DoctorCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS } from '../../theme';

const DoctorListScreen = ({ navigation }) => {
  const [doctors, setDoctors]             = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDoctorsApi();
      const doctorData = Array.isArray(response.data) ? response.data : response.data?.data;
      setDoctors(Array.isArray(doctorData) ? doctorData : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
    }, [loadDoctors])
  );

  const handleDeleteDoctor = (doctor) => {
    Alert.alert(
      'Delete Doctor',
      `Delete ${doctor.name}? Existing linked appointments will keep their history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(doctor._id);
              await deleteDoctorApi(doctor._id);
              setDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
            } catch (error) {
              Alert.alert('Delete Failed', error.response?.data?.message || 'Could not delete doctor');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && doctors.length === 0) return <LoadingSpinner message="Loading doctors..." />;

  const closeDoctorPopup = () => setSelectedDoctor(null);
  const openBooking = () => {
    const doctor = selectedDoctor;
    closeDoctorPopup();
    navigation.navigate('AppointmentBooking', { doctor });
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Our Specialists"
        subtitle={`${doctors.length} doctors available`}
        rightAction={
          isAdmin ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('DoctorForm')}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadDoctors}
        ListEmptyComponent={<EmptyState message="No doctors available" subtitle="Check back soon" />}
        renderItem={({ item }) => (
          <View>
            <DoctorCard
              doctor={item}
              onPress={() => {
                if (isAdmin) {
                  navigation.navigate('DoctorDetails', { doctor: item });
                } else {
                  setSelectedDoctor(item);
                }
              }}
            />
            {isAdmin ? (
              <View style={styles.adminRow}>
                <TouchableOpacity
                  style={styles.editLink}
                  onPress={() => navigation.navigate('DoctorForm', { doctor: item })}
                  disabled={actionLoadingId !== null}
                >
                  <Text style={styles.editLinkText}>Edit profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deletePill, actionLoadingId === item._id && styles.disabledPill]}
                  onPress={() => handleDeleteDoctor(item)}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deletePillText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.togglePill,
                    { backgroundColor: item.availabilityStatus ? COLORS.dangerBg : COLORS.successBg },
                  ]}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                  onPress={async () => {
                    try {
                      setActionLoadingId(item._id);
                      await updateDoctorApi(item._id, { availabilityStatus: !item.availabilityStatus });
                      setDoctors((prev) =>
                        prev.map((d) =>
                          d._id === item._id ? { ...d, availabilityStatus: !item.availabilityStatus } : d
                        )
                      );
                    } catch (error) {
                      Alert.alert('Error', error.response?.data?.message || 'Update failed');
                    } finally {
                      setActionLoadingId(null);
                    }
                  }}
                >
                  <Text style={[
                    styles.togglePillText,
                    { color: item.availabilityStatus ? COLORS.danger : COLORS.success },
                  ]}>
                    {item.availabilityStatus ? 'Mark Unavailable' : 'Mark Available'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      />

      <Modal
        visible={Boolean(selectedDoctor)}
        transparent
        animationType="fade"
        onRequestClose={closeDoctorPopup}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.closeBtn} onPress={closeDoctorPopup} activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>X</Text>
            </TouchableOpacity>

            {selectedDoctor ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
                {selectedDoctor.image ? (
                  <Image source={{ uri: selectedDoctor.image }} style={styles.doctorImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                      {selectedDoctor.name?.charAt(0)?.toUpperCase() || 'D'}
                    </Text>
                  </View>
                )}

                <Text style={styles.modalName}>{selectedDoctor.name || 'Doctor name'}</Text>
                <Text style={styles.modalSpec}>{selectedDoctor.specialization || 'Medical Specialist'}</Text>

                <View style={[
                  styles.modalAvailability,
                  { backgroundColor: selectedDoctor.availabilityStatus ? COLORS.successBg : COLORS.dangerBg },
                ]}>
                  <Text style={[
                    styles.modalAvailabilityText,
                    { color: selectedDoctor.availabilityStatus ? COLORS.success : COLORS.danger },
                  ]}>
                    {selectedDoctor.availabilityStatus ? 'Available for appointments' : 'Not currently available'}
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoTile}>
                    <Text style={styles.infoLabel}>Experience</Text>
                    <Text style={styles.infoValue}>{selectedDoctor.experience ?? 'N/A'} yrs</Text>
                  </View>
                  <View style={styles.infoTile}>
                    <Text style={styles.infoLabel}>Fee</Text>
                    <Text style={styles.infoValue}>
                      {selectedDoctor.consultationFee !== undefined && selectedDoctor.consultationFee !== null
                        ? `LKR ${Number(selectedDoctor.consultationFee).toLocaleString()}`
                        : 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.aboutBox}>
                  <Text style={styles.aboutTitle}>About</Text>
                  <Text style={styles.aboutText}>
                    {selectedDoctor.description || 'No additional information is available for this doctor yet.'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.bookBtn,
                    !selectedDoctor.availabilityStatus && styles.bookBtnDisabled,
                  ]}
                  onPress={openBooking}
                  disabled={!selectedDoctor.availabilityStatus}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookBtnText}>
                    {selectedDoctor.availabilityStatus ? 'Book Appointment' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { paddingTop: 12, paddingBottom: 30 },
  addBtn: {
    backgroundColor: COLORS.tealBright,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 2,
  },
  editLink:     { paddingVertical: 4, paddingHorizontal: 2 },
  editLinkText: { fontSize: 12, color: COLORS.link, fontWeight: FONTS.semibold },
  togglePill:   { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full },
  togglePillText:{ fontSize: 12, fontWeight: FONTS.bold },
  deletePill: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  deletePillText: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.danger },
  disabledPill: { opacity: 0.55 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.58)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  modalContent: {
    padding: 18,
    paddingTop: 22,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.textSecondary },
  doctorImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.bgMuted,
    marginBottom: 14,
  },
  imagePlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  imagePlaceholderText: {
    fontSize: 42,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
  },
  modalName: {
    fontSize: 22,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    textAlign: 'center',
  },
  modalSpec: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modalAvailability: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  modalAvailabilityText: { fontSize: 12, fontWeight: FONTS.bold },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 18,
  },
  infoTile: {
    flex: 1,
    backgroundColor: COLORS.bgPage,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  infoLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
  },
  aboutBox: {
    width: '100%',
    backgroundColor: COLORS.bgPage,
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 12,
  },
  aboutTitle: {
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
    marginBottom: 6,
  },
  aboutText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  bookBtn: {
    width: '100%',
    backgroundColor: COLORS.tealStrong,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  bookBtnDisabled: {
    backgroundColor: COLORS.tealPale,
  },
  bookBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: FONTS.bold,
  },
});

export default DoctorListScreen;
