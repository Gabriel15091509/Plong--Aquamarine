// src/navigation/MainTabs.js
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import SortiesListScreen from "../screens/Sorties/SortiesListScreen";
import SortieDetailsScreen from "../screens/Sorties/SortieDetailsScreen";
import InscriptionScreen from "../screens/Sorties/InscriptionScreen";
import InscriptionsListScreen from "../screens/Sorties/InscriptionsListScreen";
import InscriptionDetailsScreen from "../screens/Sorties/InscriptionDetailsScreen";
import CarnetScreen from "../screens/Carnet/CarnetScreen";
import PlongeeDetailsScreen from "../screens/Carnet/PlongeeDetailsScreen";
import ProfilScreen from "../screens/Profil/ProfilScreen";

const Tab = createBottomTabNavigator();
const SortiesStackNavigator = createNativeStackNavigator();
const CarnetStackNavigator = createNativeStackNavigator();

const SortiesStack = () => (
  <SortiesStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <SortiesStackNavigator.Screen
      name="SortiesList"
      component={SortiesListScreen}
    />
    <SortiesStackNavigator.Screen
      name="SortieDetails"
      component={SortieDetailsScreen}
    />
    <SortiesStackNavigator.Screen
      name="Inscription"
      component={InscriptionScreen}
    />
    <SortiesStackNavigator.Screen
      name="InscriptionsList"
      component={InscriptionsListScreen}
    />
    <SortiesStackNavigator.Screen
      name="InscriptionDetails"
      component={InscriptionDetailsScreen}
    />
  </SortiesStackNavigator.Navigator>
);

const CarnetStack = () => (
  <CarnetStackNavigator.Navigator screenOptions={{ headerShown: false }}>
    <CarnetStackNavigator.Screen name="CarnetList" component={CarnetScreen} />
    <CarnetStackNavigator.Screen
      name="PlongeeDetails"
      component={PlongeeDetailsScreen}
    />
  </CarnetStackNavigator.Navigator>
);

const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      })}
    >
      <Tab.Screen name="Sorties" component={SortiesStack} />
      <Tab.Screen name="Carnet" component={CarnetStack} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
