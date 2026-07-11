// src/api/client.js
import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_API_URL = "http://172.16.12.179:5000/api";

// Pour un vrai telephone, lance Expo avec:
// EXPO_PUBLIC_API_URL=http://IP_DE_TON_PC:5000/api npm start
const API_URL = "http://172.25.144.1:5000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return config;
    }
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      delete apiClient.defaults.headers.common.Authorization;
    }
    return Promise.reject(error);
  },
);

export { API_URL };
export default apiClient;
