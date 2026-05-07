import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

export const authClient = {
  login: async (email: string, password: string) => {
    const { data } = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.LOGIN}`,
      { email, password, csrfToken: true, json: true },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return data;
  },

  register: async (name: string, email: string, password: string) => {
    const { data } = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.REGISTER}`,
      { name, email, password, userType: 'customer' }
    );
    return data;
  },

  getProfile: async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const { data } = await axios.get(`${API_BASE_URL}${ENDPOINTS.ME}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  updateProfile: async (updates: { name?: string; phone?: string }) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    const { data } = await axios.put(`${API_BASE_URL}${ENDPOINTS.ME}`, updates, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data;
  },

  saveToken: async (token: string) => {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken: async () => {
    return AsyncStorage.getItem(AUTH_TOKEN_KEY);
  },

  saveUser: async (user: any) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser: async () => {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  logout: async () => {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_KEY]);
  },
};
