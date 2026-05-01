import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getAllDepartments } from '../../api/departmentApi';

const DepartmentList = ({ navigation }) => {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDepartments();
    });

    return unsubscribe;
  }, [navigation]);

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to load departments.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Hospital Departments</Text>
      <FlatList
        data={departments}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.deptName}>{item.name}</Text>
            <Text style={styles.deptLocation}>Location: {item.location}</Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDepartment')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  card: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  deptName: { fontSize: 18, fontWeight: 'bold' },
  deptLocation: { fontSize: 14, color: '#666', marginTop: 5 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#007bff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 30 },
});

export default DepartmentList;
