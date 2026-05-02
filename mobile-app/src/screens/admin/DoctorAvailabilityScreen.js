import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDoctorsApi, updateDoctorApi } from '../../api/doctorApi';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import ScreenHeader from '../../components/ScreenHeader';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const formatTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const TIME_SLOT_OPTIONS = Array.from(
  { length: ((21 - 9) * 60) / 15 + 1 },
  (_, index) => formatTime(9 * 60 + index * 15)
);

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextFourteenDays = () => {
  const today = new Date();
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      date: toDateValue(date),
      label: index === 0 ? 'Today' : date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
    };
  });
};

const DoctorAvailabilityScreen = ({ navigation }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [slotSelections, setSlotSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const nextDays = useMemo(() => getNextFourteenDays(), []);
  const selectedDoctor = doctors.find((doctor) => doctor._id === selectedDoctorId);

  const hydrateSlotSelections = (doctor) => {
    const scheduleMap = new Map(
      (doctor?.availabilitySchedule || []).map((item) => [
        item.date,
        Array.isArray(item.timeSlots)
          ? item.timeSlots.filter((slot) => TIME_SLOT_OPTIONS.includes(slot))
          : [],
      ])
    );

    setSlotSelections(
      nextDays.reduce((acc, day) => ({
        ...acc,
        [day.date]: scheduleMap.get(day.date) || [],
      }), {})
    );
  };

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getDoctorsApi();
      const doctorData = Array.isArray(response.data) ? response.data : response.data?.data;
      const activeDoctors = Array.isArray(doctorData) ? doctorData : [];
      setDoctors(activeDoctors);

      const firstDoctor = activeDoctors[0];
      if (firstDoctor && !selectedDoctorId) {
        setSelectedDoctorId(firstDoctor._id);
        hydrateSlotSelections(firstDoctor);
      } else if (selectedDoctorId) {
        const currentDoctor = activeDoctors.find((doctor) => doctor._id === selectedDoctorId);
        hydrateSlotSelections(currentDoctor);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId]);

  useFocusEffect(
    useCallback(() => {
      loadDoctors();
    }, [loadDoctors])
  );

  const selectDoctor = (doctor) => {
    setSelectedDoctorId(doctor._id);
    hydrateSlotSelections(doctor);
  };

  const toggleTimeSlot = (date, slot) => {
    setSlotSelections((prev) => {
      const currentSlots = prev[date] || [];
      const exists = currentSlots.includes(slot);
      const nextSlots = exists
        ? currentSlots.filter((item) => item !== slot)
        : [...currentSlots, slot].sort();

      return { ...prev, [date]: nextSlots };
    });
  };

  const handleSave = async () => {
    if (!selectedDoctor) {
      Alert.alert('Error', 'Please select a doctor first');
      return;
    }

    const availabilitySchedule = nextDays
      .map((day) => ({
        date: day.date,
        timeSlots: slotSelections[day.date] || [],
      }))
      .filter((item) => item.timeSlots.length > 0);

    if (availabilitySchedule.length === 0) {
      Alert.alert('Error', 'Please add at least one time slot in the next 14 days');
      return;
    }

    setSaving(true);
    try {
      await updateDoctorApi(selectedDoctor._id, {
        availabilityMode: 'custom',
        dailyTimeSlots: [],
        availabilitySchedule,
      });
      Alert.alert('Availability Saved', 'Doctor availability was updated for the next 14 days.');
      await loadDoctors();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading doctors..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Doctor Availability"
        subtitle="Manage next 14 days"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>SELECT DOCTOR</Text>
        <View style={styles.doctorList}>
          {doctors.map((doctor) => {
            const selected = doctor._id === selectedDoctorId;
            return (
              <TouchableOpacity
                key={doctor._id}
                style={[styles.doctorChip, selected && styles.doctorChipSelected]}
                onPress={() => selectDoctor(doctor)}
                activeOpacity={0.85}
              >
                <Text style={[styles.doctorChipName, selected && styles.doctorChipNameSelected]}>{doctor.name}</Text>
                <Text style={[styles.doctorChipSpec, selected && styles.doctorChipSpecSelected]}>{doctor.specialization}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>NEXT 14 DAYS</Text>
        <View style={styles.formCard}>
          {nextDays.map((day) => {
            const selectedSlots = slotSelections[day.date] || [];

            return (
              <View key={day.date} style={styles.dayRow}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={styles.dayLabel}>{day.label}</Text>
                    <Text style={styles.selectedSlotSummary}>
                      {selectedSlots.length > 0 ? `${selectedSlots.length} selected` : 'No slots selected'}
                    </Text>
                  </View>
                  <Text style={styles.dayDate}>{day.date}</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.slotScroller}
                >
                  {TIME_SLOT_OPTIONS.map((slot) => {
                    const selected = selectedSlots.includes(slot);
                    return (
                      <TouchableOpacity
                        key={`${day.date}-${slot}`}
                        style={[styles.timeSlotChip, selected && styles.timeSlotChipSelected]}
                        onPress={() => toggleTimeSlot(day.date, slot)}
                        activeOpacity={0.82}
                      >
                        <Text style={[styles.timeSlotText, selected && styles.timeSlotTextSelected]}>{slot}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </View>

        <CustomButton
          title={saving ? 'Saving...' : 'Save Availability'}
          onPress={handleSave}
          disabled={saving}
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 10, marginLeft: 4, marginTop: 4 },
  doctorList: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 16,
    ...SHADOW.card,
  },
  doctorChip: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    backgroundColor: COLORS.bgPage,
  },
  doctorChipSelected: {
    backgroundColor: COLORS.tealFaint,
    borderColor: COLORS.tealStrong,
  },
  doctorChipName: {
    fontSize: 14,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
  },
  doctorChipNameSelected: { color: COLORS.tealStrong },
  doctorChipSpec: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: FONTS.medium,
  },
  doctorChipSpecSelected: { color: COLORS.tealStrong },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    ...SHADOW.card,
  },
  dayRow: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingBottom: 10,
    marginBottom: 10,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 14,
    color: COLORS.navyDeep,
    fontWeight: FONTS.bold,
  },
  dayDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: FONTS.semibold,
  },
  selectedSlotSummary: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
    marginTop: 3,
  },
  slotScroller: {
    paddingVertical: 4,
    gap: 8,
  },
  timeSlotChip: {
    minWidth: 64,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: COLORS.bgPage,
  },
  timeSlotChipSelected: {
    backgroundColor: COLORS.tealStrong,
    borderColor: COLORS.tealStrong,
  },
  timeSlotText: {
    fontSize: 13,
    color: COLORS.navyDeep,
    fontWeight: FONTS.semibold,
  },
  timeSlotTextSelected: {
    color: COLORS.white,
  },
  submitBtn: { marginTop: 16 },
});

export default DoctorAvailabilityScreen;
