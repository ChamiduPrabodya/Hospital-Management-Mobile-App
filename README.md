# Doctor Appointment Mobile App

A React Native mobile application built with Expo for managing doctors, services, appointments, payments, complaints, and reports.

## Overview

This project is a healthcare appointment management mobile app with user authentication, doctor browsing, appointment booking, payment tracking, complaint management, report generation, and an admin dashboard.

The app is built with:
- Expo
- React Native
- React Navigation
- Axios
- AsyncStorage

## Key Features

- User authentication: register, login, logout
- Doctor listing and doctor details
- Add / edit doctor records (admin)
- Service management: create and list services
- Appointment booking with date & time slot selection
- Appointment list and appointment details
- Payment creation and payment history
- Complaint creation and complaint list
- Report generation and report history
- Profile screen
- Admin dashboard screen

## Tech Stack

- `expo` ~54.0.33
- `react` 19.1.0
- `react-native` 0.81.5
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`
- `axios`
- `@react-native-async-storage/async-storage`

## Prerequisites

- Node.js installed
- Expo CLI installed globally: `npm install -g expo-cli`
- A working backend API running and accessible from the app
- Expo Go app for mobile testing or iOS/Android emulator

## Setup

1. Clone the repository

```bash
git clone <your-repo-url>
cd mobile-app
```

2. Install dependencies

```bash
npm install
```

3. Configure backend URL

Open `src/utils/constants.js` and update `BASE_URL` to point to your backend API.

```js
export const BASE_URL = 'http://localhost:5000/api';
```

If you run the backend on a local machine and want to use a physical device, replace `localhost` with your machine's local network IP.

## Run the app

```bash
npm start
```

Then use one of the following:

- `a` for Android emulator
- `i` for iOS simulator
- scan the QR code with Expo Go

## App Structure

```
App.js
index.js
package.json
src/
  api/
    appointmentApi.js
    authApi.js
    axios.js
    complaintApi.js
    doctorApi.js
    paymentApi.js
    reportApi.js
    serviceApi.js
    uploadApi.js
    userApi.js
  components/
    AppointmentCard.js
    ComplaintCard.js
    CustomButton.js
    CustomInput.js
    DoctorCard.js
    EmptyState.js
    LoadingSpinner.js
    ReportCard.js
    ScreenHeader.js
    ServiceCard.js
  context/
    AuthContext.js
  navigation/
    AppNavigator.js
    AuthNavigator.js
    MainNavigator.js
  screens/
    admin/
      AdminDashboardScreen.js
    appointments/
      AppointmentBookingScreen.js
      AppointmentDetailsScreen.js
      AppointmentListScreen.js
    auth/
      LoginScreen.js
      RegisterScreen.js
    common/
      HomeScreen.js
      ProfileScreen.js
    complaints/
      ComplaintFormScreen.js
      ComplaintListScreen.js
    doctors/
      DoctorDetailsScreen.js
      DoctorFormScreen.js
      DoctorListScreen.js
    payments/
      PaymentFormScreen.js
      PaymentListScreen.js
    reports/
      ReportGenerateScreen.js
      ReportListScreen.js
    services/
      ServiceFormScreen.js
      ServiceListScreen.js
  utils/
    constants.js
    storage.js
    validators.js
  theme.js
```

## Important Files

- `App.js` - root component that wraps the app in `AuthProvider` and `NavigationContainer`
- `src/navigation/AppNavigator.js` - decides between auth flow and main app flow based on `userToken`
- `src/navigation/MainNavigator.js` - bottom tab navigation and app screen routes
- `src/context/AuthContext.js` - authentication provider and state management
- `src/api/axios.js` - Axios instance with authorization interceptor
- `src/utils/constants.js` - holds backend API URL and shared constants
- `src/theme.js` - app colors, fonts, radius, and shadow styles

## Authentication Flow

The app uses token-based authentication:

- Login and registration both call the backend via Axios
- Valid tokens are stored in AsyncStorage under `userToken`
- User info is stored under `userInfo`
- `AuthContext` exposes `login`, `register`, `logout`, `userToken`, `userInfo`, and `isLoading`
- `AppNavigator` switches between `AuthNavigator` and `MainNavigator` based on authentication state

## Backend API Notes

The app expects a backend API to expose endpoints for:

- `POST /auth/login`
- `POST /auth/register`
- `GET /doctors`, `POST /doctors`, `PUT /doctors/:id`, `DELETE /doctors/:id`
- `GET /services`, `POST /services`, `PUT /services/:id`, `DELETE /services/:id`
- `GET /appointments`, `POST /appointments`, `GET /appointments/:id`, `PUT /appointments/:id`
- `GET /payments`, `POST /payments`
- `GET /complaints`, `POST /complaints`
- `GET /reports`, `POST /reports`

The mobile app attaches the bearer token automatically to requests using `axios` in `src/api/axios.js`.

## Custom Components

- `CustomInput` - styled input fields
- `CustomButton` - primary buttons with app styling
- `ScreenHeader` - header component with title, subtitle, and back button
- `LoadingSpinner` - full-screen loading indicator
- `AppointmentCard`, `DoctorCard`, `ComplaintCard`, `ReportCard`, `ServiceCard` - list item cards

## Screens and User Journey

1. Auth flow
   - `LoginScreen`
   - `RegisterScreen`
2. Main flow
   - `HomeScreen`
   - `ProfileScreen`
   - `AdminDashboardScreen`
3. Doctor management
   - `DoctorListScreen`
   - `DoctorDetailsScreen`
   - `DoctorFormScreen`
4. Service management
   - `ServiceListScreen`
   - `ServiceFormScreen`
5. Appointments
   - `AppointmentBookingScreen`
   - `AppointmentListScreen`
   - `AppointmentDetailsScreen`
6. Payments
   - `PaymentListScreen`
   - `PaymentFormScreen`
7. Complaints
   - `ComplaintListScreen`
   - `ComplaintFormScreen`
8. Reports
   - `ReportListScreen`
   - `ReportGenerateScreen`

## Notes for GitHub

- Add a descriptive repository title such as `Doctor Appointment Mobile App`
- Use this README as the root `README.md`
- Mention that the backend API URL must be updated before running the app
- Highlight that this is built with Expo and supports Android/iOS via Expo Go

## Running Tests

The app includes a Jest setup.

```bash
npm test
```

## Troubleshooting

- If the app fails to connect, verify `BASE_URL` in `src/utils/constants.js`
- If Expo cannot reach the backend on a physical device, use your machine IP address instead of `localhost`
- If screen shows blank or crashes, restart Expo and clear cache with `npm start -- --clear`

## License

This project is private and ready to be shared as a GitHub portfolio project.
