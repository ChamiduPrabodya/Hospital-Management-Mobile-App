import React, { useState, useCallback, useContext, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, Alert, TouchableOpacity, Text,
  ScrollView, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAppointmentsApi, updateAppointmentStatusApi } from '../../api/appointmentApi';
import { getDoctorsApi } from '../../api/doctorApi';
import AppointmentCard from '../../components/AppointmentCard';
import DoctorCard from '../../components/DoctorCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const ALL_SECTIONS = 'All Sections';

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayDate = () => toDateValue(new Date());

const parseDateValue = (value) => {
  const [year, month, day] = String(value).split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatReadableDate = (value) => {
  if (value === getTodayDate()) return 'Today';
  return parseDateValue(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isBeforeToday = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

const getCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = firstDay.getDay();
  const days = Array.from({ length: leadingBlanks }, (_, index) => ({ key: `blank-${index}`, blank: true }));

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);
    days.push({
      key: toDateValue(date),
      date,
      value: toDateValue(date),
      day,
      disabled: isBeforeToday(date),
    });
  }

  return days;
};

const getDoctorSlotsForDate = (doctor, dateValue) => {
  if (!doctor) return [];
  if (doctor.availabilityMode === 'daily') {
    return Array.isArray(doctor.dailyTimeSlots) ? doctor.dailyTimeSlots : [];
  }

  const schedule = Array.isArray(doctor.availabilitySchedule) ? doctor.availabilitySchedule : [];
  return schedule.find((item) => item.date === dateValue)?.timeSlots || [];
};

const AppointmentListScreen = ({ navigation }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState(ALL_SECTIONS);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorDropdownOpen, setDoctorDropdownOpen] = useState(false);
  const [specializationSearch, setSpecializationSearch] = useState('');
  const [specializationOpen, setSpecializationOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(getTodayDate());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => parseDateValue(getTodayDate()));
  const [showDoctorResults, setShowDoctorResults] = useState(false);
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';
  const isDoctor = userInfo?.role === 'doctor';
  const isPatient = userInfo?.role === 'patient';

  const specializations = useMemo(() => {
    const values = doctors
      .map((doctor) => String(doctor.specialization || '').trim())
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSection = selectedSpecialization === ALL_SECTIONS
        || doctor.specialization === selectedSpecialization;
      const searchableText = `${doctor.name || ''}`.toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      return matchesSection && matchesSearch;
    });
  }, [doctorSearch, doctors, selectedSpecialization]);

  const doctorDropdownOptions = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSearch = !query || String(doctor.name || '').toLowerCase().includes(query);
      const matchesSection = selectedSpecialization === ALL_SECTIONS
        || doctor.specialization === selectedSpecialization;
      return matchesSearch && matchesSection;
    });
  }, [doctorSearch, doctors, selectedSpecialization]);

  const visibleSpecializations = useMemo(() => {
    const query = specializationSearch.trim().toLowerCase();
    const options = [ALL_SECTIONS, ...specializations];
    if (!query) return options;
    return options.filter((specialization) => {
      const label = specialization === ALL_SECTIONS ? 'Any Specialization' : specialization;
      return label.toLowerCase().includes(query);
    });
  }, [specializationSearch, specializations]);

  const calendarDays = useMemo(() => getCalendarDays(calendarMonth), [calendarMonth]);
  const calendarTitle = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAppointmentsApi();
      const appointmentData = Array.isArray(res.data) ? res.data : res.data?.data;
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (error) {
      console.error('Failed to load appointments:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
      if (isPatient) {
        loadDoctorsForBooking();
      }
    }, [isPatient, loadAppointments])
  );

  const loadDoctorsForBooking = async () => {
    if (doctors.length > 0) return;

    setDoctorsLoading(true);
    try {
      const response = await getDoctorsApi();
      const doctorData = Array.isArray(response.data) ? response.data : response.data?.data;
      const availableDoctors = Array.isArray(doctorData)
        ? doctorData.filter((doctor) => doctor.availabilityStatus)
        : [];
      setDoctors(availableDoctors);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load doctors');
    } finally {
      setDoctorsLoading(false);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    setActionLoadingId(id);
    try {
      await updateAppointmentStatusApi(id, nextStatus);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: nextStatus } : a))
      );
      Alert.alert('Updated', `Appointment ${nextStatus}`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Update failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDoctorForBooking = (doctor) => {
    navigation.navigate('AppointmentBooking', { doctor, initialDate: appointmentDate });
  };

  const handleSearchDoctors = async () => {
    await loadDoctorsForBooking();
    if (selectedDoctor) {
      handleDoctorForBooking(selectedDoctor);
      return;
    }
    setShowDoctorResults(true);
  };

  if (loading && appointments.length === 0) return <LoadingSpinner message="Loading appointments..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={isDoctor ? 'My Schedule' : 'Appointments'}
        subtitle={`${appointments.length} total`}
      />

      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadAppointments}
        ListHeaderComponent={isPatient ? (
          <View style={styles.finderWrap}>
            <Text style={styles.finderTitle}>Find your Doctor</Text>
            <Text style={styles.finderTitle}>Book an Appointment</Text>

            <View style={styles.finderRow}>
              <View style={styles.finderIconBox}>
                <View style={styles.doctorIcon}>
                  <View style={styles.doctorIconHead} />
                  <View style={styles.doctorIconBody} />
                  <View style={styles.doctorIconTie} />
                  <View style={styles.doctorIconScopeLeft} />
                  <View style={styles.doctorIconScopeRight} />
                </View>
              </View>
              <TextInput
                value={doctorSearch}
                onChangeText={(value) => {
                  setDoctorSearch(value);
                  setSelectedDoctor(null);
                  setDoctorDropdownOpen(true);
                }}
                onFocus={() => setDoctorDropdownOpen(true)}
                placeholder="Serach Doctor"
                placeholderTextColor={COLORS.textMuted}
                style={styles.finderInput}
                maxLength={20}
                autoCapitalize="words"
              />
              {doctorSearch ? (
                <TouchableOpacity
                  style={styles.finderHelpBox}
                  onPress={() => {
                    setDoctorSearch('');
                    setSelectedDoctor(null);
                    setDoctorDropdownOpen(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.finderHelpText}>X</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.finderHelpBox}
                  onPress={() => setDoctorDropdownOpen((current) => !current)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.finderChevron, doctorDropdownOpen && styles.finderChevronOpen]} />
                </TouchableOpacity>
              )}
            </View>

            {doctorDropdownOpen ? (
              <View style={styles.doctorDropdown}>
                {doctorsLoading ? (
                  <Text style={styles.noDoctorText}>Loading doctors...</Text>
                ) : (
                  <ScrollView style={styles.doctorDropdownList} nestedScrollEnabled>
                    {doctorDropdownOptions.map((doctor) => {
                      const selected = selectedDoctor?._id === doctor._id;
                      return (
                        <TouchableOpacity
                          key={doctor._id}
                          style={[styles.doctorOption, selected && styles.doctorOptionSelected]}
                          onPress={() => {
                            setSelectedDoctor(doctor);
                            setDoctorSearch(doctor.name || '');
                            setSelectedSpecialization(doctor.specialization || ALL_SECTIONS);
                            setSpecializationSearch('');
                            if (getDoctorSlotsForDate(doctor, appointmentDate).length === 0) {
                              const nextDate = doctor.availabilityMode === 'daily'
                                ? getTodayDate()
                                : (doctor.availabilitySchedule || [])
                                  .filter((item) => item.date >= getTodayDate() && item.timeSlots?.length > 0)
                                  .sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
                              if (nextDate) setAppointmentDate(nextDate);
                            }
                            setDoctorDropdownOpen(false);
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={[styles.doctorOptionName, selected && styles.doctorOptionNameSelected]}>
                            {doctor.name || 'Doctor name'}
                          </Text>
                          <Text style={[styles.doctorOptionSpec, selected && styles.doctorOptionSpecSelected]}>
                            {doctor.specialization || 'Specialist'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {doctorDropdownOptions.length === 0 ? (
                      <Text style={styles.noDoctorText}>No doctors found</Text>
                    ) : null}
                  </ScrollView>
                )}
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.finderRow}
              onPress={() => setSpecializationOpen((current) => !current)}
              activeOpacity={0.85}
            >
              <View style={styles.finderIconBox}>
                <View style={styles.specializationIcon}>
                  <View style={styles.specializationIconH} />
                  <View style={styles.specializationIconV} />
                </View>
              </View>
              <Text style={styles.finderValue}>
                {selectedSpecialization === ALL_SECTIONS ? 'Any Specialization' : selectedSpecialization}
              </Text>
              <View style={[styles.finderChevron, specializationOpen && styles.finderChevronOpen]} />
            </TouchableOpacity>

            {specializationOpen ? (
              <View style={styles.specializationDropdown}>
                <TextInput
                  value={specializationSearch}
                  onChangeText={setSpecializationSearch}
                  placeholder="Type or search specialization"
                  placeholderTextColor={COLORS.textMuted}
                  style={styles.specializationSearchInput}
                  autoCapitalize="words"
                />
                <ScrollView style={styles.specializationList} nestedScrollEnabled>
                  {visibleSpecializations.map((specialization) => {
                    const selected = specialization === selectedSpecialization;
                    return (
                      <TouchableOpacity
                        key={specialization}
                        style={[styles.specializationOption, selected && styles.specializationOptionSelected]}
                        onPress={() => {
                          setSelectedSpecialization(specialization);
                          if (
                            selectedDoctor
                            && specialization !== ALL_SECTIONS
                            && selectedDoctor.specialization !== specialization
                          ) {
                            setSelectedDoctor(null);
                            setDoctorSearch('');
                          }
                          setSpecializationOpen(false);
                          setSpecializationSearch('');
                          setDoctorDropdownOpen(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.specializationOptionText, selected && styles.specializationOptionTextSelected]}>
                          {specialization === ALL_SECTIONS ? 'Any Specialization' : specialization}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {visibleSpecializations.length === 0 ? (
                    <Text style={styles.noSpecializationText}>No specializations found</Text>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.finderRow}
              onPress={() => setCalendarOpen((current) => !current)}
              activeOpacity={0.85}
            >
              <View style={styles.finderIconBox}>
                <View style={styles.calendarIcon}>
                  <View style={styles.calendarIconHeader} />
                  <View style={styles.calendarIconRings}>
                    <View style={styles.calendarIconRing} />
                    <View style={styles.calendarIconRing} />
                  </View>
                  <View style={styles.calendarIconGrid}>
                    {[0, 1, 2, 3, 4, 5].map((dot) => (
                      <View key={dot} style={styles.calendarIconDot} />
                    ))}
                  </View>
                </View>
              </View>
              <Text style={styles.finderValue}>
                {formatReadableDate(appointmentDate)}
              </Text>
              <View style={[styles.finderChevron, calendarOpen && styles.finderChevronOpen]} />
            </TouchableOpacity>

            {calendarOpen ? (
              <View style={styles.calendarDropdown}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    style={[styles.calendarNavBtn, isBeforeToday(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)) && styles.calendarNavBtnDisabled]}
                    disabled={isBeforeToday(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1))}
                    onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calendarNavText}>{'<'}</Text>
                  </TouchableOpacity>
                  <Text style={styles.calendarTitle}>{calendarTitle}</Text>
                  <TouchableOpacity
                    style={styles.calendarNavBtn}
                    onPress={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.calendarNavText}>{'>'}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.weekRow}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map((item) => {
                    if (item.blank) return <View key={item.key} style={styles.calendarDayBlank} />;
                    const selected = item.value === appointmentDate;
                    const unavailableForDoctor = selectedDoctor && getDoctorSlotsForDate(selectedDoctor, item.value).length === 0;
                    const disabled = item.disabled || unavailableForDoctor;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.calendarDay,
                          selected && styles.calendarDaySelected,
                          disabled && styles.calendarDayDisabled,
                        ]}
                        disabled={disabled}
                        onPress={() => {
                          setAppointmentDate(item.value);
                          setCalendarOpen(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          selected && styles.calendarDayTextSelected,
                          disabled && styles.calendarDayTextDisabled,
                        ]}>
                          {item.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearchDoctors}
              activeOpacity={0.85}
            >
              <Text style={styles.searchBtnText}>{doctorsLoading ? 'Searching...' : 'Search'}</Text>
            </TouchableOpacity>

            {showDoctorResults ? (
              <View style={styles.resultsWrap}>
                <Text style={styles.resultsTitle}>Matching Doctors</Text>
                {filteredDoctors.length === 0 ? (
                  <EmptyState message="No doctors found" subtitle="Try another doctor name or specialization" />
                ) : (
                  filteredDoctors.map((doctor) => (
                    <DoctorCard
                      key={doctor._id}
                      doctor={doctor}
                      onPress={() => handleDoctorForBooking(doctor)}
                    />
                  ))
                )}
              </View>
            ) : null}

            <View style={styles.yourAppointmentsHeader}>
              <Text style={styles.yourAppointmentsTitle}>Your Appointments</Text>
              <Text style={styles.yourAppointmentsSubtitle}>
                {appointments.length} already booked
              </Text>
            </View>
          </View>
        ) : null}
        ListEmptyComponent={
          <EmptyState
            message={isDoctor ? 'No assigned appointments' : 'No appointments found'}
            subtitle={isDoctor ? 'Assigned patient bookings will appear here' : 'Book your first appointment with a specialist'}
          />
        }
        renderItem={({ item }) => (
          <View>
            <AppointmentCard
              appointment={item}
              viewerRole={userInfo?.role}
              onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
            />
            {isAdmin && item.status === 'pending' ? (
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnLeft, styles.approveBtn]}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                  onPress={() => handleStatusChange(item._id, 'approved')}
                >
                  <Text style={styles.actionBtnText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                  onPress={() => handleStatusChange(item._id, 'rejected')}
                >
                  <Text style={styles.actionBtnText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  list: { paddingTop: 12, paddingBottom: 30 },
  newAppointmentBtn: {
    minWidth: 72,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.tealStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  newAppointmentPlus: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: FONTS.bold,
    marginRight: 5,
    lineHeight: 20,
  },
  newAppointmentText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: FONTS.bold,
  },
  finderWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  finderTitle: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: FONTS.medium,
    color: COLORS.navyDeep,
    textAlign: 'center',
  },
  finderRow: {
    minHeight: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 14,
  },
  finderIconBox: {
    width: 46,
    alignSelf: 'stretch',
    backgroundColor: COLORS.bgMuted,
    borderRightWidth: 1,
    borderRightColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: FONTS.bold,
  },
  doctorIcon: {
    width: 18,
    height: 20,
    alignItems: 'center',
    position: 'relative',
  },
  doctorIconHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
    marginTop: 1,
  },
  doctorIconBody: {
    width: 15,
    height: 10,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    backgroundColor: COLORS.textSecondary,
    marginTop: 1,
  },
  doctorIconTie: {
    position: 'absolute',
    bottom: 2,
    width: 3,
    height: 7,
    borderRadius: 1,
    backgroundColor: COLORS.white,
  },
  doctorIconScopeLeft: {
    position: 'absolute',
    bottom: 1,
    left: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: COLORS.white,
  },
  doctorIconScopeRight: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1.2,
    borderColor: COLORS.white,
  },
  specializationIcon: {
    width: 15,
    height: 15,
    borderRadius: 3,
    backgroundColor: COLORS.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specializationIconH: {
    width: 9,
    height: 3,
    borderRadius: 1,
    backgroundColor: COLORS.white,
  },
  specializationIconV: {
    position: 'absolute',
    width: 3,
    height: 9,
    borderRadius: 1,
    backgroundColor: COLORS.white,
  },
  calendarIcon: {
    width: 17,
    height: 18,
    borderWidth: 1.7,
    borderColor: COLORS.textSecondary,
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  calendarIconHeader: {
    height: 4,
    backgroundColor: COLORS.textSecondary,
  },
  calendarIconRings: {
    position: 'absolute',
    top: -2,
    left: 3,
    right: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarIconRing: {
    width: 2,
    height: 5,
    borderRadius: 1,
    backgroundColor: COLORS.textSecondary,
  },
  calendarIconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  calendarIconDot: {
    width: 2.3,
    height: 2.3,
    borderRadius: 1.2,
    backgroundColor: COLORS.textSecondary,
    marginRight: 2,
    marginBottom: 2,
  },
  finderInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 14,
    color: COLORS.navyDeep,
    fontSize: 16,
    fontWeight: FONTS.medium,
  },
  finderHelpBox: {
    width: 46,
    alignSelf: 'stretch',
    backgroundColor: COLORS.bgMuted,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderHelpText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: FONTS.bold,
  },
  doctorDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderTopWidth: 0,
  },
  doctorDropdownList: {
    maxHeight: 220,
  },
  doctorOption: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  doctorOptionSelected: {
    backgroundColor: COLORS.navyDeep,
  },
  doctorOptionName: {
    color: COLORS.navyDeep,
    fontSize: 15,
    fontWeight: FONTS.semibold,
  },
  doctorOptionNameSelected: {
    color: COLORS.white,
  },
  doctorOptionSpec: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: FONTS.medium,
  },
  doctorOptionSpecSelected: {
    color: 'rgba(255,255,255,0.72)',
  },
  noDoctorText: {
    color: COLORS.textMuted,
    fontSize: 13,
    padding: 12,
    fontWeight: FONTS.medium,
  },
  finderValue: {
    flex: 1,
    color: COLORS.navyDeep,
    fontSize: 15,
    fontWeight: FONTS.medium,
    paddingHorizontal: 14,
  },
  finderChevron: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.textMuted,
    marginHorizontal: 14,
  },
  finderChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  specializationDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderTopWidth: 0,
    padding: 8,
  },
  specializationSearchInput: {
    minHeight: 38,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    color: COLORS.navyDeep,
    fontSize: 14,
    marginBottom: 6,
  },
  specializationList: {
    maxHeight: 210,
  },
  specializationOption: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  specializationOptionSelected: {
    backgroundColor: COLORS.navyDeep,
  },
  specializationOptionText: {
    color: COLORS.navyDeep,
    fontSize: 15,
    fontWeight: FONTS.medium,
  },
  specializationOptionTextSelected: {
    color: COLORS.white,
  },
  noSpecializationText: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  calendarDropdown: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderTopWidth: 0,
    padding: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calendarTitle: {
    fontSize: 15,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
  },
  calendarNavBtn: {
    width: 34,
    height: 30,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavBtnDisabled: {
    opacity: 0.35,
  },
  calendarNavText: {
    color: COLORS.navyDeep,
    fontSize: 16,
    fontWeight: FONTS.bold,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayBlank: {
    width: `${100 / 7}%`,
    height: 38,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  calendarDaySelected: {
    backgroundColor: COLORS.tealStrong,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
  },
  calendarDayTextSelected: {
    color: COLORS.white,
  },
  calendarDayTextDisabled: {
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  inlineSectionRow: {
    paddingTop: 10,
    paddingBottom: 2,
  },
  inlineSectionChip: {
    minHeight: 34,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inlineSectionChipSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  inlineSectionText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONTS.semibold,
  },
  inlineSectionTextSelected: {
    color: COLORS.white,
  },
  inlineDateRow: {
    paddingTop: 10,
    paddingBottom: 2,
  },
  inlineDateChip: {
    minHeight: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inlineDateChipSelected: {
    backgroundColor: COLORS.tealFaint,
    borderColor: COLORS.tealStrong,
  },
  inlineDateText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: FONTS.semibold,
  },
  inlineDateTextSelected: {
    color: COLORS.tealStrong,
  },
  searchBtn: {
    minHeight: 43,
    borderRadius: 4,
    backgroundColor: '#8799D7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  searchBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: FONTS.bold,
  },
  resultsWrap: {
    marginTop: 18,
  },
  resultsTitle: {
    fontSize: 13,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    marginLeft: 4,
    marginBottom: 4,
  },
  yourAppointmentsHeader: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  yourAppointmentsTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
  },
  yourAppointmentsSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: FONTS.medium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.58)',
    justifyContent: 'flex-end',
  },
  bookingPicker: {
    maxHeight: '88%',
    backgroundColor: COLORS.bgPage,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    paddingTop: 18,
    paddingBottom: 8,
    ...SHADOW.card,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  pickerTitleBlock: { flex: 1, paddingRight: 12 },
  pickerTitle: {
    fontSize: 18,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
  },
  pickerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: FONTS.medium,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: FONTS.bold,
    color: COLORS.textSecondary,
  },
  pickerLabel: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
    letterSpacing: 1.4,
    marginHorizontal: 18,
    marginBottom: 8,
    marginTop: 4,
  },
  searchWrap: {
    marginHorizontal: 18,
    marginBottom: 14,
    minHeight: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    color: COLORS.navyDeep,
    fontSize: 14,
    fontWeight: FONTS.medium,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  clearSearchText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: FONTS.bold,
  },
  sectionRow: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  sectionChip: {
    minHeight: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  sectionChipSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  sectionChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: FONTS.semibold,
  },
  sectionChipTextSelected: {
    color: COLORS.white,
  },
  pickerDoctorList: {
    paddingBottom: 18,
  },
  pickerLoading: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLoadingText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
  },
  adminActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  actionBtnLeft: { marginRight: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  approveBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.danger },
  actionBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
});

export default AppointmentListScreen;
