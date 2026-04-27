import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMeApi,
  loginApi,
  registerApi,
  updateMeApi,
} from '../api/authApi';

export const AuthContext = createContext();

const persistUserSession = async ({ token, user }) => {
  await AsyncStorage.setItem('userToken', token);
  await AsyncStorage.setItem('userInfo', JSON.stringify(user));
};

const clearUserSession = async () => {
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userInfo');
};

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyAuthenticatedUser = async (response) => {
    const { token, ...user } = response.data;
    setUserToken(token);
    setUserInfo(user);
    await persistUserSession({ token, user });
  };

  const login = async (email, password) => {
    const response = await loginApi(email, password);
    await applyAuthenticatedUser(response);
  };

  const register = async (name, email, phone, address, password) => {
    const response = await registerApi(name, email, phone, address, password);
    await applyAuthenticatedUser(response);
  };

  const refreshUser = async () => {
    const response = await getMeApi();
    const user = response.data;
    setUserInfo(user);
    await AsyncStorage.setItem('userInfo', JSON.stringify(user));
    return user;
  };

  const updateProfile = async (profileData) => {
    const response = await updateMeApi(profileData);
    const user = response.data;
    setUserInfo(user);
    await AsyncStorage.setItem('userInfo', JSON.stringify(user));
    return user;
  };

  const logout = async () => {
    setUserToken(null);
    setUserInfo(null);
    await clearUserSession();
  };

  const isLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const savedUserInfo = await AsyncStorage.getItem('userInfo');
      if (token) {
        setUserToken(token);
        if (savedUserInfo) {
          setUserInfo(JSON.parse(savedUserInfo));
        }
        await refreshUser();
      }
    } catch (error) {
      setUserToken(null);
      setUserInfo(null);
      await clearUserSession();
      console.log('Cleared invalid saved login:', error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      userToken,
      userInfo,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
