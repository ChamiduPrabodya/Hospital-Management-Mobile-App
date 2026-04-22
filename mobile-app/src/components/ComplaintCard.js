import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SHADOW, statusColor } from '../theme';

const ComplaintCard = ({ complaint }) => {
  const sc = statusColor(complaint.status);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.subject}>{complaint.subject}</Text>
        <View style={[styles.badge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.badgeText, { color: sc.text }]}>
            {complaint.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <Text style={styles.message} numberOfLines={3}>{complaint.message}</Text>
      {complaint.adminReply ? (
        <View style={styles.replyBox}>
          <Text style={styles.replyLabel}>Admin reply</Text>
          <Text style={styles.replyText}>{complaint.adminReply}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    ...SHADOW.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subject: {
    fontSize: 15,
    fontWeight: FONTS.bold,
    color: COLORS.navyDeep,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: FONTS.bold,
    textTransform: 'capitalize',
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  replyBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.tealFaint,
    borderRadius: RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.tealBright,
  },
  replyLabel: {
    fontSize: 10,
    fontWeight: FONTS.bold,
    color: COLORS.tealStrong,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  replyText: {
    fontSize: 13,
    color: COLORS.navyDeep,
    lineHeight: 18,
  },
});

export default ComplaintCard;