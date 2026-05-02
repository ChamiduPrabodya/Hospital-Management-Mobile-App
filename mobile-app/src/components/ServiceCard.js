import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW } from '../theme';

const ServiceCard = ({ service, onPress }) => {
  const price = service.price !== undefined && service.price !== null
    ? `LKR ${Number(service.price).toLocaleString()}`
    : 'LKR 0';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.iconBox}>
        {/* Plus / medical cross */}
        <View style={styles.crossV} />
        <View style={styles.crossH} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{service.serviceName}</Text>
        {service?.departmentId?.name ? <Text style={styles.department}>{service.departmentId.name}</Text> : null}
        <Text style={styles.desc} numberOfLines={2}>{service.description}</Text>
        <View style={styles.footRow}>
          <Text style={styles.price}>{price}</Text>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{service.duration} min</Text>
          </View>
          <View style={[
            styles.availBadge,
            { backgroundColor: service.availabilityStatus ? COLORS.successBg : COLORS.dangerBg }
          ]}>
            <Text style={[
              styles.availText,
              { color: service.availabilityStatus ? COLORS.success : COLORS.danger }
            ]}>
              {service.availabilityStatus ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    ...SHADOW.card,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.tealFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },
  crossV: {
    position: 'absolute',
    width: 6,
    height: 22,
    backgroundColor: COLORS.tealBright,
    borderRadius: 2,
  },
  crossH: {
    position: 'absolute',
    width: 22,
    height: 6,
    backgroundColor: COLORS.tealBright,
    borderRadius: 2,
  },
  info: { flex: 1 },
  name: {
    fontSize: 15,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    marginBottom: 3,
  },
  desc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 17,
    marginBottom: 8,
  },
  department: {
    fontSize: 11,
    color: COLORS.tealBright,
    fontWeight: FONTS.semibold,
    marginBottom: 3,
  },
  footRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 14,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
    marginRight: 4,
  },
  durationBadge: {
    backgroundColor: COLORS.tealFaint,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  durationText: {
    fontSize: 11,
    color: COLORS.tealStrong,
    fontWeight: FONTS.semibold,
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  availText: {
    fontSize: 11,
    fontWeight: FONTS.semibold,
  },
});

export default ServiceCard;
