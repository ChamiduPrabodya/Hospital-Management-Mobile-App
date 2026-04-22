import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      const { token, ...user } = response.data;
      setUserToken(token);
      setUserInfo(user);
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post('/auth/register', { name, email, password });
      const { token, ...user } = response.data;
      setUserToken(token);
      setUserInfo(user);
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setUserToken(null);
    setUserInfo(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userInfo');
  };

  const isLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        const response = await axios.get('/auth/me');
        const user = response.data;
        setUserToken(token);
        setUserInfo(user);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      }
    } catch (error) {
      setUserToken(null);
      setUserInfo(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
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
      userToken,
      userInfo,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
