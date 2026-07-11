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

  const colors = {
    light: {
      background: "#f5f5f5",
      card: "#ffffff",
      text: "#1a1a2e",
      textSecondary: "#666666",
      border: "#e0e0e0",
      primary: "#1a73e8",
      primaryLight: "#e3f2fd",
      success: "#4caf50",
      error: "#f44336",
      warning: "#ff9800",
      shadow: "rgba(0,0,0,0.1)",
    },
    dark: {
      background: "#121212",
      card: "#1e1e1e",
      text: "#ffffff",
      textSecondary: "#999999",
      border: "#333333",
      primary: "#1a73e8",
      primaryLight: "#1a237e",
      success: "#4caf50",
      error: "#f44336",
      warning: "#ff9800",
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
