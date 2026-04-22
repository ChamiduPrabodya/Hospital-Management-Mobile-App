import React, { useState, useCallback, useContext } from 'react';
import { View, FlatList, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteServiceApi, getServicesApi } from '../../api/serviceApi';
import ServiceCard from '../../components/ServiceCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ScreenHeader from '../../components/ScreenHeader';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, FONTS, RADIUS } from '../../theme';

const ServiceListScreen = ({ navigation }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { userInfo } = useContext(AuthContext);
  const isAdmin = userInfo?.role === 'admin';

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getServicesApi();
      const serviceData = Array.isArray(res.data) ? res.data : res.data?.data;
      setServices(Array.isArray(serviceData) ? serviceData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  const handleDeleteService = (service) => {
    Alert.alert(
      'Delete Service',
      `Delete ${service.serviceName}? Existing linked appointments will keep their history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(service._id);
              await deleteServiceApi(service._id);
              setServices((prev) => prev.filter((s) => s._id !== service._id));
            } catch (error) {
              Alert.alert('Delete Failed', error.response?.data?.message || 'Could not delete service');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading && services.length === 0) return <LoadingSpinner message="Loading services..." />;

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Our Services"
        subtitle={`${services.length} services available`}
        rightAction={
          isAdmin ? (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('ServiceForm')}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          ) : null
        }
      />
      <FlatList
        data={services}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={loadServices}
        ListEmptyComponent={<EmptyState message="No services available" />}
        renderItem={({ item }) => (
          <View>
            <ServiceCard
              service={item}
              onPress={() => {
                if (isAdmin) {
                  navigation.navigate('ServiceForm', { service: item });
                } else {
                  Alert.alert(
                    item.serviceName,
                    `${item.description}\n\nPrice: LKR ${Number(item.price || 0).toLocaleString()}\nDuration: ${item.duration} min`
                  );
                }
              }}
            />
            {isAdmin ? (
              <View style={styles.adminRow}>
                <TouchableOpacity
                  style={styles.editPill}
                  onPress={() => navigation.navigate('ServiceForm', { service: item })}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editPillText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deletePill, actionLoadingId === item._id && styles.disabledPill]}
                  onPress={() => handleDeleteService(item)}
                  disabled={actionLoadingId === item._id}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deletePillText}>Delete</Text>
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
  addBtn: {
    backgroundColor: COLORS.tealBright,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
  },
  addBtnText: { color: COLORS.white, fontSize: 13, fontWeight: FONTS.bold },
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 2,
  },
  editPill: {
    backgroundColor: COLORS.tealFaint,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  editPillText: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.tealStrong },
  deletePill: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  deletePillText: { fontSize: 12, fontWeight: FONTS.bold, color: COLORS.danger },
  disabledPill: { opacity: 0.55 },
});

export default ServiceListScreen;
