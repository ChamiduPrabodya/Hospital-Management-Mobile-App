import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { COLORS, FONTS } from '../theme';

const ScreenHeader = ({ title, subtitle, onBack, rightAction }) => (
  <View style={styles.header}>
    <View style={styles.row}>
      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <View style={styles.backArrow} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightAction ? <View style={styles.rightSlot}>{rightAction}</View> : null}
    </View>
    <View style={styles.accent} />
  </View>
);

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.navyMid,
    paddingTop: Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backArrow: {
    width: 10,
    height: 10,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.white,
    transform: [{ rotate: '45deg' }],
    marginLeft: 3,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 2,
    fontWeight: FONTS.regular,
  },
  rightSlot: {
    marginLeft: 12,
  },
  accent: {
    width: 36,
    height: 3,
    backgroundColor: COLORS.tealLight,
    borderRadius: 2,
    marginTop: 12,
  },
});

export default ScreenHeader;