// src/api/client.js
import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";


const IPV4_HOST_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const getLanHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(":")[0];
  return host && IPV4_HOST_REGEX.test(host) ? host : null;
};

const lanHost = getLanHost();
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (lanHost ? `http://${lanHost}:5000/api` : "http://localhost:5000/api");

console.log("[client.js] API_URL utilisee :", API_URL);

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
