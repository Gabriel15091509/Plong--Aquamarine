// src/screens/Auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const { colors } = useTheme();

  const handleRegister = async () => {
    const { nom, prenom, email, password, passwordConfirm } = formData;

    if (!nom || !prenom || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');
    const result = await register({ 
      nom, prenom, email, password, 
      role: 'adherent' 
    });
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Erreur d\'inscription');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Inscription</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Créez votre compte adhérent
          </Text>
        </View>

        {error ? (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.halfWidth, styles.inputGroup]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Nom</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
                value={formData.nom}
                onChangeText={(text) => setFormData({...formData, nom: text})}
              />
            </View>
            <View style={[styles.halfWidth, styles.inputGroup]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                placeholder="Votre prénom"
                placeholderTextColor={colors.textSecondary}
                value={formData.prenom}
                onChangeText={(text) => setFormData({...formData, prenom: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              placeholder="votre@email.com"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={formData.password}
              onChangeText={(text) => setFormData({...formData, password: text})}
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirmer le mot de passe</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.card, 
                borderColor: colors.border,
                color: colors.text 
              }]}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={formData.passwordConfirm}
              onChangeText={(text) => setFormData({...formData, passwordConfirm: text})}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.linkContainer}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>
              Déjà un compte ? Se connecter
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputGroup: {
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RegisterScreen;