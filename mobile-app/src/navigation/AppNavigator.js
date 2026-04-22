import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { userToken } = useContext(AuthContext);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {userToken ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}