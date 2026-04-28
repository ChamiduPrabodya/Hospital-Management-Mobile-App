import React, { useContext, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── Screens ──────────────────────────────────────────────────────────────────
import HomeScreen              from '../screens/common/HomeScreen';
import DoctorListScreen        from '../screens/doctors/DoctorListScreen';
import DoctorDetailsScreen     from '../screens/doctors/DoctorDetailsScreen';
import DoctorFormScreen        from '../screens/doctors/DoctorFormScreen';
import ServiceListScreen       from '../screens/services/ServiceListScreen';
import ServiceFormScreen       from '../screens/services/ServiceFormScreen';
import AppointmentListScreen   from '../screens/appointments/AppointmentListScreen';
import AppointmentBookingScreen from '../screens/appointments/AppointmentBookingScreen';
import AppointmentDetailsScreen from '../screens/appointments/AppointmentDetailsScreen';
import PaymentListScreen       from '../screens/payments/PaymentListScreen';
import PaymentFormScreen       from '../screens/payments/PaymentFormScreen';
import ComplaintListScreen     from '../screens/complaints/ComplaintListScreen';
import ComplaintFormScreen     from '../screens/complaints/ComplaintFormScreen';
import ReportListScreen        from '../screens/reports/ReportListScreen';
import ReportGenerateScreen    from '../screens/reports/ReportGenerateScreen';
import ReportDetailsScreen     from '../screens/reports/ReportDetailsScreen';
import ProfileScreen           from '../screens/common/ProfileScreen';
import AdminDashboardScreen    from '../screens/admin/AdminDashboardScreen';
import UserListScreen          from '../screens/admin/UserListScreen';
import PatientDetailsScreen    from '../screens/admin/PatientDetailsScreen';
import { AuthContext }         from '../context/AuthContext';

// ── Design tokens (mirrors your theme) ───────────────────────────────────────
const C = {
  navyDeep:    '#1A1A2E',
  navyMid:     '#16213E',
  tealStrong:  '#0D7F6F',
  tealBright:  '#00BFA5',
  tealLight:   '#4DD0E1',
  tealFaint:   '#E0F2F1',
  white:       '#FFFFFF',
  textMuted:   '#94A3B8',
  divider:     '#E2E8F0',
  bgPage:      '#F8FAFC',
};

const { width } = Dimensions.get('window');
const TAB_WIDTH  = width;

// ── SVG-style icon primitives drawn with Views ────────────────────────────────

const HomeIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
    {/* Roof triangle */}
    <View style={{
      position: 'absolute', top: 0,
      width: 0, height: 0,
      borderLeftWidth: size / 2, borderRightWidth: size / 2, borderBottomWidth: size * 0.55,
      borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
    }} />
    {/* House body */}
    <View style={{
      width: size * 0.72, height: size * 0.52,
      backgroundColor: color, borderRadius: 2,
    }} />
    {/* Door */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: size * 0.26, height: size * 0.3,
      backgroundColor: color === C.white ? C.navyMid : C.white,
      borderTopLeftRadius: 2, borderTopRightRadius: 2,
    }} />
  </View>
);

const DoctorIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Head */}
    <View style={{
      position: 'absolute', top: 0,
      width: size * 0.44, height: size * 0.44,
      borderRadius: size * 0.22, backgroundColor: color,
    }} />
    {/* Body */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: size * 0.72, height: size * 0.46,
      backgroundColor: color, borderTopLeftRadius: size * 0.36, borderTopRightRadius: size * 0.36,
    }} />
    {/* Stethoscope cross */}
    <View style={{
      position: 'absolute', bottom: size * 0.22,
      width: size * 0.22, height: size * 0.04,
      backgroundColor: color === C.white ? C.navyMid : C.white,
    }} />
    <View style={{
      position: 'absolute', bottom: size * 0.14,
      width: size * 0.04, height: size * 0.22,
      backgroundColor: color === C.white ? C.navyMid : C.white,
    }} />
  </View>
);

const CalendarIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size }}>
    {/* Calendar body */}
    <View style={{
      position: 'absolute', bottom: 0,
      width: size, height: size * 0.76,
      backgroundColor: color, borderRadius: 3,
    }} />
    {/* Header bar */}
    <View style={{
      position: 'absolute', bottom: size * 0.58,
      width: size, height: size * 0.22,
      backgroundColor: color === C.white ? 'rgba(255,255,255,0.35)' : C.tealStrong,
      borderTopLeftRadius: 3, borderTopRightRadius: 3,
    }} />
    {/* Ring left */}
    <View style={{
      position: 'absolute', top: 0, left: size * 0.2,
      width: size * 0.12, height: size * 0.26,
      backgroundColor: color, borderRadius: 2,
    }} />
    {/* Ring right */}
    <View style={{
      position: 'absolute', top: 0, right: size * 0.2,
      width: size * 0.12, height: size * 0.26,
      backgroundColor: color, borderRadius: 2,
    }} />
    {/* Grid dots */}
    {[0, 1, 2].map(col => (
      <View key={col} style={{
        position: 'absolute', bottom: size * 0.12,
        left: size * (0.15 + col * 0.28),
        width: size * 0.14, height: size * 0.14,
        backgroundColor: color === C.white ? 'rgba(255,255,255,0.5)' : C.white,
        borderRadius: 1,
      }} />
    ))}
  </View>
);

const ServiceIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Plus cross */}
    <View style={{ width: size, height: size * 0.28, backgroundColor: color, borderRadius: 2 }} />
    <View style={{
      position: 'absolute',
      width: size * 0.28, height: size, backgroundColor: color, borderRadius: 2,
    }} />
  </View>
);

const PaymentIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size * 0.76, marginTop: size * 0.12 }}>
    <View style={{
      width: size, height: size * 0.76,
      borderWidth: 2, borderColor: color, borderRadius: 4,
    }} />
    {/* Stripe */}
    <View style={{
      position: 'absolute', top: size * 0.18,
      width: size, height: size * 0.16,
      backgroundColor: color,
    }} />
    {/* Chip */}
    <View style={{
      position: 'absolute', bottom: size * 0.14, left: size * 0.12,
      width: size * 0.28, height: size * 0.2,
      backgroundColor: color, borderRadius: 2,
    }} />
  </View>
);

const ComplaintIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Speech bubble */}
    <View style={{
      width: size, height: size * 0.76,
      backgroundColor: color, borderRadius: 5,
    }} />
    {/* Tail */}
    <View style={{
      position: 'absolute', bottom: 0, left: size * 0.22,
      width: 0, height: 0,
      borderLeftWidth: size * 0.12, borderRightWidth: size * 0.04,
      borderTopWidth: size * 0.18,
      borderLeftColor: 'transparent', borderRightColor: 'transparent',
      borderTopColor: color,
    }} />
    {/* Lines */}
    {[0, 1, 2].map(i => (
      <View key={i} style={{
        position: 'absolute', top: size * (0.18 + i * 0.16),
        left: size * 0.16,
        width: size * (0.7 - i * 0.18), height: size * 0.07,
        backgroundColor: color === C.white ? 'rgba(255,255,255,0.45)' : C.white,
        borderRadius: 1,
      }} />
    ))}
  </View>
);

const ProfileIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center' }}>
    <View style={{
      width: size * 0.46, height: size * 0.46,
      borderRadius: size * 0.23, backgroundColor: color, marginBottom: 2,
    }} />
    <View style={{
      width: size * 0.76, height: size * 0.44,
      backgroundColor: color,
      borderTopLeftRadius: size * 0.38, borderTopRightRadius: size * 0.38,
    }} />
  </View>
);

const ReportIcon = ({ color, size = 22 }) => (
  <View style={{ width: size * 0.8, height: size, marginHorizontal: size * 0.1 }}>
    <View style={{
      width: size * 0.8, height: size,
      backgroundColor: color, borderRadius: 3,
    }} />
    {/* Lines */}
    {[0.22, 0.42, 0.62, 0.78].map((top, i) => (
      <View key={i} style={{
        position: 'absolute', top: size * top, left: size * 0.12,
        width: size * (i === 3 ? 0.3 : 0.56), height: size * 0.07,
        backgroundColor: color === C.white ? 'rgba(255,255,255,0.45)' : C.white,
        borderRadius: 1,
      }} />
    ))}
    {/* Folded corner */}
    <View style={{
      position: 'absolute', top: 0, right: 0,
      width: size * 0.22, height: size * 0.22,
      backgroundColor: color === C.white ? 'rgba(255,255,255,0.3)' : C.tealFaint,
      borderBottomLeftRadius: 3,
    }} />
  </View>
);

const AdminIcon = ({ color, size = 22 }) => (
  <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    {/* Shield */}
    <View style={{
      width: size * 0.82, height: size * 0.9,
      backgroundColor: color, borderRadius: 4,
      borderBottomLeftRadius: size * 0.41, borderBottomRightRadius: size * 0.41,
    }} />
    {/* Star center */}
    <View style={{
      position: 'absolute',
      width: size * 0.28, height: size * 0.28,
      borderRadius: size * 0.14,
      backgroundColor: color === C.white ? 'rgba(255,255,255,0.45)' : C.white,
    }} />
  </View>
);

// ── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP = {
  Home:         HomeIcon,
  Doctors:      DoctorIcon,
  Appointments: CalendarIcon,
  Services:     ServiceIcon,
  Payments:     PaymentIcon,
  Complaints:   ComplaintIcon,
  Profile:      ProfileIcon,
  Reports:      ReportIcon,
  Admin:        AdminIcon,
};

// ── Animated Tab Button ───────────────────────────────────────────────────────
const TabButton = ({ route, isFocused, onPress, onLongPress }) => {
  const scaleAnim = useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;
  const glowAnim  = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1 : 0.88,
        tension: 80, friction: 8,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [isFocused]);

  const IconComponent = ICON_MAP[route.name] || HomeIcon;
  const iconColor     = isFocused ? C.white : C.textMuted;

  const pillBg = glowAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: ['transparent', C.tealStrong],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabBtn}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.tabPill,
          { backgroundColor: pillBg, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <IconComponent color={iconColor} size={20} />
      </Animated.View>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]} numberOfLines={1}>
        {route.name}
      </Text>
    </TouchableOpacity>
  );
};

// ── Custom Tab Bar ────────────────────────────────────────────────────────────
const CustomTabBar = ({ state, descriptors, navigation }) => {
  // Slide indicator animation
  const tabCount   = state.routes.length;
  const tabW       = TAB_WIDTH / tabCount;
  const slideAnim  = useRef(new Animated.Value(state.index * tabW)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index * tabW,
      tension: 70, friction: 10,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabBarOuter}>
      {/* Top border accent */}
      <View style={styles.tabBarTopBorder} />

      {/* Sliding teal indicator dot */}
      <Animated.View
        style={[
          styles.slideIndicator,
          { width: tabW, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.slideIndicatorDot} />
      </Animated.View>

      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

// ── Tab Navigator ─────────────────────────────────────────────────────────────
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  const { userInfo } = useContext(AuthContext);
  const isAdmin      = userInfo?.role === 'admin';
  const isDoctor     = userInfo?.role === 'doctor';

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"         component={HomeScreen} />
      {!isDoctor ? <Tab.Screen name="Doctors" component={DoctorListScreen} /> : null}
      <Tab.Screen name="Appointments" component={AppointmentListScreen} />
      {!isDoctor ? <Tab.Screen name="Services" component={ServiceListScreen} /> : null}
      {!isDoctor ? <Tab.Screen name="Payments" component={PaymentListScreen} /> : null}
      {!isDoctor ? <Tab.Screen name="Complaints" component={ComplaintListScreen} /> : null}
      {isAdmin ? <Tab.Screen name="Reports" component={ReportListScreen} /> : null}
      {isAdmin ? <Tab.Screen name="Admin"   component={AdminDashboardScreen} /> : null}
      <Tab.Screen name="Profile"      component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Main Navigator ────────────────────────────────────────────────────────────
export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs"                component={Tabs} />
      <Stack.Screen name="DoctorDetails"       component={DoctorDetailsScreen} />
      <Stack.Screen name="DoctorForm"          component={DoctorFormScreen} />
      <Stack.Screen name="ServiceForm"         component={ServiceFormScreen} />
      <Stack.Screen name="AppointmentBooking"  component={AppointmentBookingScreen} />
      <Stack.Screen name="AppointmentDetails"  component={AppointmentDetailsScreen} />
      <Stack.Screen name="PaymentForm"         component={PaymentFormScreen} />
      <Stack.Screen name="ComplaintForm"       component={ComplaintFormScreen} />
      <Stack.Screen name="ReportGenerate"      component={ReportGenerateScreen} />
      <Stack.Screen name="ReportDetails"       component={ReportDetailsScreen} />
      <Stack.Screen name="Users"               component={UserListScreen} />
      <Stack.Screen name="PatientDetails"      component={PatientDetailsScreen} />
    </Stack.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 82 : 66;

const styles = StyleSheet.create({
  // Outer wrapper — white card with top shadow
  tabBarOuter: {
    backgroundColor: C.white,
    height: TAB_BAR_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? 18 : 4,
    borderTopWidth: 0,
    shadowColor: C.navyDeep,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
  },

  // Thin teal accent line at very top
  tabBarTopBorder: {
    height: 2,
    backgroundColor: C.tealStrong,
    opacity: 0.15,
  },

  tabBarInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Sliding top indicator
  slideIndicator: {
    position: 'absolute',
    top: 2, // just below top border
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideIndicatorDot: {
    width: 28,
    height: 3,
    backgroundColor: C.tealStrong,
    borderRadius: 2,
  },

  // Each tab button
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 3,
  },

  // Pill background behind icon when active
  tabPill: {
    width: 44,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: C.textMuted,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: C.tealStrong,
    fontWeight: '700',
  },
});
