// src/components/common/StatusBadge.js
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../context/ThemeContext";

// Meme table de statuts que frontend/src/components/Common/StatusBadge.jsx
// (bg-*-100/text-*-700 en clair, bg-*-900/text-*-400 en sombre) pour garder
// un rendu identique entre le web et le mobile.
const statusConfig = {
  Planifiée: { light: ["#dbeafe", "#1d4ed8"], dark: ["#1e3a8a", "#60a5fa"] },
  "En cours": { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },
  Terminée: { light: ["#f3f4f6", "#374151"], dark: ["#374151", "#9ca3af"] },
  Annulée: { light: ["#fee2e2", "#b91c1c"], dark: ["#7f1d1d", "#f87171"] },

  "En attente": { light: ["#fef9c3", "#a16207"], dark: ["#713f12", "#facc15"] },
  Confirmée: { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },
  "Liste d'attente": {
    light: ["#dbeafe", "#1d4ed8"],
    dark: ["#1e3a8a", "#60a5fa"],
  },

  Actif: { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },
  Inactif: { light: ["#f3f4f6", "#374151"], dark: ["#374151", "#9ca3af"] },
  Suspendu: { light: ["#ffedd5", "#c2410c"], dark: ["#7c2d12", "#fb923c"] },

  Payé: { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },
  Validé: { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },
  Partiel: { light: ["#fef9c3", "#a16207"], dark: ["#713f12", "#facc15"] },
  Remboursé: { light: ["#f3e8ff", "#7e22ce"], dark: ["#581c87", "#c084fc"] },

  Expiré: { light: ["#fee2e2", "#b91c1c"], dark: ["#7f1d1d", "#f87171"] },
  Valide: { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },

  Abandonnée: { light: ["#fee2e2", "#b91c1c"], dark: ["#7f1d1d", "#f87171"] },
  Suspendue: { light: ["#ffedd5", "#c2410c"], dark: ["#7c2d12", "#fb923c"] },

  Neuf: { light: ["#dcfce7", "#15803d"], dark: ["#14532d", "#4ade80"] },
  Bon: { light: ["#dbeafe", "#1d4ed8"], dark: ["#1e3a8a", "#60a5fa"] },
  Usagé: { light: ["#fef9c3", "#a16207"], dark: ["#713f12", "#facc15"] },
  "À réparer": { light: ["#ffedd5", "#c2410c"], dark: ["#7c2d12", "#fb923c"] },
  "Hors service": { light: ["#fee2e2", "#b91c1c"], dark: ["#7f1d1d", "#f87171"] },
};

const DEFAULT = { light: ["#f3f4f6", "#4b5563"], dark: ["#374151", "#9ca3af"] };

const StatusBadge = ({ status }) => {
  const { isDark } = useTheme();
  const [bg, text] = (statusConfig[status] || DEFAULT)[isDark ? "dark" : "light"];

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{status || "Inconnu"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default StatusBadge;
