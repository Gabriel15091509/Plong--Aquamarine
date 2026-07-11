// src/components/Logo.js
import React from "react";
import { Image, StyleSheet } from "react-native";

const Logo = ({ size = "md", style }) => {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 150,
  };

  return (
    <Image
      source={require("../../../assets/aqua.png")}
      style={[styles.logo, { width: sizes[size], height: sizes[size] }, style]}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    // Les dimensions sont définies dynamiquement
  },
});

export default Logo;
