import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, Alert, ScrollView,
  TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { updateUserApi } from '../../api/userApi';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import LoadingSpinner from '../../components/LoadingSpinner';
import { COLORS, FONTS, RADIUS, SHADOW } from '../../theme';

const ProfileScreen = () => {
  const { userInfo, logout } = useContext(AuthContext);
  const [name,    setName]    = useState(userInfo?.name    || '');
  const [email,   setEmail]   = useState(userInfo?.email   || '');
  const [phone,   setPhone]   = useState(userInfo?.phone   || '');
  const [address, setAddress] = useState(userInfo?.address || '');
  const [loading, setLoading] = useState(false);

  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await updateUserApi(userInfo._id, { name, email, phone, address });
      Alert.alert('Profile Updated', 'Your information has been saved successfully.');
    } catch (error) {
      Alert.alert('Update Failed', error.response?.data?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Saving profile..." />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDeep} />

      <View style={styles.hero}>
        <View style={styles.circle1} /><View style={styles.circle2} />
        <Text style={styles.heroEst}>VICTORIA HOSPITAL</Text>
        <Text style={styles.heroTitle}>My Profile</Text>
        <View style={styles.accentBar} />
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userInfo?.role || 'Patient'}</Text>
          </View>
        </View>
        <Text style={styles.heroName}>{name}</Text>
        <Text style={styles.heroEmail}>{email}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>ACCOUNT INFORMATION</Text>

        <View style={styles.formCard}>
          <CustomInput label="Full Name"     value={name}    onChangeText={setName}    placeholder="Your name"    />
          <CustomInput label="Email Address" value={email}   onChangeText={setEmail}   placeholder="Your email"   keyboardType="email-address" />
          <CustomInput label="Phone Number"  value={phone}   onChangeText={setPhone}   placeholder="Your phone"   keyboardType="phone-pad" />
          <CustomInput label="Address"       value={address} onChangeText={setAddress} placeholder="Your address" />
        </View>

        <CustomButton title="Save Changes" onPress={handleUpdate} style={styles.saveBtn} />

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgPage },
  hero: {
    backgroundColor: COLORS.navyMid,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 28,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.04)', top: -50, right: -60 },
  circle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(255,255,255,0.05)', bottom: -20, left: -30 },
  heroEst:    { fontSize: 9, letterSpacing: 2.2, color: 'rgba(255,255,255,0.45)', marginBottom: 6 },
  heroTitle:  { fontSize: 20, fontWeight: FONTS.bold, color: COLORS.white, marginBottom: 10 },
  accentBar:  { width: 36, height: 3, backgroundColor: COLORS.tealLight, borderRadius: 2, marginBottom: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.tealBright,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { fontSize: 24, fontWeight: FONTS.bold, color: COLORS.white },
  roleBadge: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  roleText:   { fontSize: 11, color: COLORS.white, fontWeight: FONTS.semibold, letterSpacing: 1, textTransform: 'uppercase' },
  heroName:   { fontSize: 18, fontWeight: FONTS.bold,    color: COLORS.white, marginTop: 8 },
  heroEmail:  { fontSize: 13, fontWeight: FONTS.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 20, paddingBottom: 40 },
  sectionLabel:  { fontSize: 10, fontWeight: FONTS.bold, color: COLORS.tealBright, letterSpacing: 2, marginBottom: 12, marginLeft: 4 },

  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, ...SHADOW.card,
  },
  saveBtn:    { marginBottom: 10 },
  logoutBtn: {
    paddingVertical: 14, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.danger, alignItems: 'center', marginTop: 6,
  },
  logoutText: { fontSize: 14, fontWeight: FONTS.semibold, color: COLORS.danger },
});

export default ProfileScreen;
