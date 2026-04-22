import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../theme';

const EmptyState = ({ message = 'Nothing here yet', subtitle }) => (
  <View style={styles.container}>
    {/* Medical cross illustration */}
    <View style={styles.iconWrap}>
      <View style={styles.crossV} />
      <View style={styles.crossH} />
    </View>
    <Text style={styles.message}>{message}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgPage,
    padding: 40,
  },
  iconWrap: {
    width: 64,
    height: 64,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossV: {
    position: 'absolute',
    width: 18,
    height: 56,
    backgroundColor: COLORS.tealPale,
    borderRadius: 4,
  },
  crossH: {
    position: 'absolute',
    width: 56,
    height: 18,
    backgroundColor: COLORS.tealPale,
    borderRadius: 4,
  },
  message: {
    fontSize: 17,
    fontWeight: FONTS.semibold,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default EmptyState;