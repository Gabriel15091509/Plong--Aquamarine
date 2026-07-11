// src/navigation/MainTabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SortiesListScreen from "../screens/Sorties/SortiesListScreen";
import SortieDetailsScreen from "../screens/Sorties/SortieDetailsScreen";
import CarnetScreen from "../screens/Carnet/CarnetScreen";
import ProfilScreen from "../screens/Profil/ProfilScreen";

const Tab = createBottomTabNavigator();
const SortiesStackNavigator = createNativeStackNavigator();

const SortiesStack = () => {
  const { colors } = useTheme();

  return (
    <SortiesStackNavigator.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <SortiesStackNavigator.Screen
        name="SortiesList"
        component={SortiesListScreen}
        options={{ title: "Sorties" }}
        screenOptions={{
          headerShown: false, // ✅ Cache complètement le header pour tous les écrans
        }}
      />
      <SortiesStackNavigator.Screen
        name="SortieDetails"
        component={SortieDetailsScreen}
        options={{ headerShown: false }}
        screenOptions={{
          headerShown: false, // ✅ Cache complètement le header pour tous les écrans
        }}
      />
    </SortiesStackNavigator.Navigator>
  );
};

const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Sorties") {
            iconName = focused ? "boat" : "boat-outline";
          } else if (route.name === "Carnet") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "Profil") {
            iconName = focused ? "person" : "person-outline";
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen
        name="Sorties"
        component={SortiesStack}
        options={{ title: "Sorties", headerShown: false }}
        screenOptions={{
          headerShown: false, // ✅ Cache complètement le header pour tous les écrans
        }}
      />
      <Tab.Screen
        name="Carnet"
        component={CarnetScreen}
        options={{ title: "Carnet de plongee" }}
        screenOptions={{
          headerShown: false, // ✅ Cache complètement le header pour tous les écrans
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfilScreen}
        options={{ title: "Mon Profil" }}
        screenOptions={{
          headerShown: false, // ✅ Cache complètement le header pour tous les écrans
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
