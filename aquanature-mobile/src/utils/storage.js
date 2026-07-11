// src/utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Sauvegarde des données
 */
export const saveData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    return false;
  }
};

/**
 * Récupère des données
 */
export const loadData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Erreur chargement:', error);
    return null;
  }
};

/**
 * Supprime des données
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Erreur suppression:', error);
    return false;
  }
};

/**
 * Sauvegarde des préférences utilisateur
 */
export const saveUserPreferences = async (preferences) => {
  return saveData('userPreferences', preferences);
};

/**
 * Récupère les préférences utilisateur
 */
export const loadUserPreferences = async () => {
  return loadData('userPreferences');
};

/**
 * Sauvegarde les données hors ligne
 */
export const saveOfflineData = async (key, data) => {
  return saveData(`offline_${key}`, data);
};

/**
 * Récupère les données hors ligne
 */
export const loadOfflineData = async (key) => {
  return loadData(`offline_${key}`);
};