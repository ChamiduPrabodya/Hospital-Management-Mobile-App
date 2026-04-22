import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme';

const LoadingSpinner = ({ message = 'Please wait...' }) => (
  <View style={styles.container}>
    <View style={styles.card}>
      <ActivityIndicator size="large" color={COLORS.tealStrong} />
      <Text style={styles.text}>{message}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgPage,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 14,
    shadowColor: COLORS.tealStrong,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  text: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: FONTS.medium,
    letterSpacing: 0.3,
  },
});

export default LoadingSpinner;