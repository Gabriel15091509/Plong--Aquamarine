// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState("light");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      if (savedTheme) {
        setTheme(savedTheme);
      } else {
        setTheme(systemTheme || "light");
      }
    } catch (error) {
      console.error("Erreur chargement thème:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem("theme", newTheme);
    } catch (error) {
      console.error("Erreur sauvegarde thème:", error);
    }
  };

  // Palette alignee sur frontend/tailwind.config.js (primary/ocean) pour que
  // l'appli mobile reprenne visuellement le meme style que le site web.
  const colors = {
    light: {
      background: "#f9fafb", // gray-50 (body du web)
      card: "#ffffff",
      text: "#1f2937", // gray-800 (titres du web)
      textSecondary: "#6b7280", // gray-500
      border: "#e5e7eb", // gray-200
      primary: "#2563eb", // primary-600
      primaryLight: "#dbeafe", // primary-100
      ocean: "#0ea5e9", // ocean-500 (fin de degrade primary -> ocean)
      success: "#16a34a", // green-600
      error: "#dc2626", // red-600
      warning: "#d97706", // amber-600
      shadow: "rgba(0,0,0,0.1)",
    },
    dark: {
      background: "#111827", // gray-900
      card: "#1f2937", // gray-800
      text: "#f3f4f6", // gray-100
      textSecondary: "#9ca3af", // gray-400
      border: "#374151", // gray-700
      primary: "#3b82f6", // primary-500
      primaryLight: "#1e3a8a", // primary-900
      ocean: "#0ea5e9", // ocean-500
      success: "#22c55e", // green-500
      error: "#ef4444", // red-500
      warning: "#f59e0b", // amber-500
      shadow: "rgba(0,0,0,0.3)",
    },
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: colors[theme],
        isDark: theme === "dark",
        toggleTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
