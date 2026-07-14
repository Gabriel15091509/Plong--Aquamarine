// src/screens/Auth/LoginScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Logo from "../../components/common/Logo";

const { width, height } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const bubbleAnim1 = useRef(new Animated.Value(0)).current;
  const bubbleAnim2 = useRef(new Animated.Value(0)).current;
  const bubbleAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const animateBubble = (anim, duration, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    animateBubble(bubbleAnim1, 4000, 0);
    animateBubble(bubbleAnim2, 5000, 2000);
    animateBubble(bubbleAnim3, 6000, 4000);
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    setError("");
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || "Erreur de connexion");
    }
  };

  const bubble1Y = bubbleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });
  const bubble1X = bubbleAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 10, 0],
  });
  const bubble2Y = bubbleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });
  const bubble2X = bubbleAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -10, 0],
  });
  const bubble3Scale = bubbleAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.2, 1],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bulles d'arrière-plan */}
        <Animated.View
          style={[
            styles.bubble,
            {
              top: 40,
              left: 20,
              width: 80,
              height: 80,
              backgroundColor: isDark
                ? "rgba(37, 99, 235, 0.1)"
                : "rgba(37, 99, 235, 0.08)",
              transform: [{ translateY: bubble1Y }, { translateX: bubble1X }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bubble,
            {
              bottom: 100,
              right: 20,
              width: 100,
              height: 100,
              backgroundColor: isDark
                ? "rgba(14, 165, 233, 0.1)"
                : "rgba(14, 165, 233, 0.08)",
              transform: [{ translateY: bubble2Y }, { translateX: bubble2X }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.bubble,
            {
              top: height * 0.4,
              left: width * 0.3,
              width: 150,
              height: 150,
              backgroundColor: isDark
                ? "rgba(37, 99, 235, 0.05)"
                : "rgba(37, 99, 235, 0.05)",
              transform: [{ scale: bubble3Scale }],
            },
          ]}
        />

        {/* Carte principale */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? "rgba(31, 41, 55, 0.95)"
                : "rgba(255, 255, 255, 0.95)",
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          {/* Logo et titre */}
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.logoContainer,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Logo size="xl" />
            </Animated.View>
            <Text style={[styles.title, { color: colors.text }]}>
              Aquanature
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Connectez-vous à votre compte
            </Text>
          </View>

          {/* Erreur */}
          {error ? (
            <Animated.View
              style={[
                styles.errorContainer,
                { backgroundColor: colors.error + "20" },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </Animated.View>
          ) : null}

          {/* Formulaire */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email
              </Text>
              <View
                style={[styles.inputContainer, { borderColor: colors.border }]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {email ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#4caf50"
                    style={styles.inputRightIcon}
                  />
                ) : null}
              </View>
            </View>

            {/* Mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Mot de passe
              </Text>
              <View
                style={[styles.inputContainer, { borderColor: colors.border }]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Options */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity style={styles.rememberContainer}>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border, backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <Text
                  style={[styles.rememberText, { color: colors.textSecondary }]}
                >
                  Se souvenir de moi
                </Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bouton de connexion */}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.ocean]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Text>
                {!loading && (
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              © 2024 Aquanature. Tous droits réservés.
            </Text>
            <View style={styles.footerBadges}>
              <Text style={[styles.badge, { color: colors.textSecondary }]}>
                🔒 Sécurisé
              </Text>
              <Text style={[styles.badge, { color: colors.textSecondary }]}>
                💳 Paiement sécurisé
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  bubble: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.5,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  inputRightIcon: {
    marginLeft: 8,
  },
  eyeButton: {
    padding: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  rememberContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  rememberText: {
    fontSize: 13,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "500",
  },
  button: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
  },
  footerBadges: {
    flexDirection: "row",
    gap: 12,
  },
  badge: {
    fontSize: 11,
  },
});

export default LoginScreen;
