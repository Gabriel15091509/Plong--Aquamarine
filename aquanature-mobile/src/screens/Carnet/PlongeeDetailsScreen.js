// src/screens/Carnet/PlongeeDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { plongees, sorties } from '../../api/endpoints';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate, formatDateTime } from '../../utils/helpers';

// Memes couleurs que le degrade de statut de PlongeeDetails.jsx cote web
const VALIDATED_GRADIENT = ['#10b981', '#059669'];
const PENDING_GRADIENT = ['#eab308', '#d97706'];

const PlongeeDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { plongeeId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [plongee, setPlongee] = useState(null);
  const [sortie, setSortie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await plongees.getById(plongeeId);
        const data = response.data.data;
        setPlongee(data);

        if (data?.id_sortie) {
          try {
            const sortieResponse = await sorties.getById(data.id_sortie);
            setSortie(sortieResponse.data.data);
          } catch (err) {
            // La sortie associée n'est pas accessible/trouvée : on affiche
            // quand même les détails de la plongée sans ce contexte.
          }
        }
      } catch (err) {
        console.error('Erreur chargement plongée:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [plongeeId]);

  if (loading) return <LoadingSpinner />;

  if (!plongee) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Plongée non trouvée
        </Text>
      </View>
    );
  }

  const isValidated = !!plongee.id_moniteur_validateur;
  const composers = plongee.palanquee?.composers || [];

  const InfoItem = ({ icon, label, value, highlight = false }) => (
    <View
      style={[
        styles.infoItem,
        highlight && { backgroundColor: colors.primary + '14', borderLeftWidth: 3, borderLeftColor: colors.primary },
      ]}
    >
      <View
        style={[
          styles.infoIconWrap,
          { backgroundColor: highlight ? colors.primary + '26' : colors.background },
        ]}
      >
        <Ionicons name={icon} size={16} color={highlight ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value || 'Non renseigné'}</Text>
      </View>
    </View>
  );

  const SectionCard = ({ title, icon, children }) => (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.primary + '1a' }]}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 24 }}
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      {/* En-tête */}
      <View style={styles.header}>
        <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '1a' }]}>
          <Ionicons name="pulse" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Plongée du <Text style={{ color: colors.primary }}>{formatDate(plongee.date)}</Text>
          </Text>
          <Text style={[styles.headerMeta, { color: colors.textSecondary }]}>
            N°{plongee.id_plongee} · {plongee.type_plongee}
          </Text>
        </View>
      </View>

      {/* Carte statut */}
      <LinearGradient
        colors={isValidated ? VALIDATED_GRADIENT : PENDING_GRADIENT}
        style={styles.statutCard}
      >
        <View style={styles.statutRow}>
          <View style={styles.statutIconWrap}>
            <Ionicons name={isValidated ? 'checkmark-circle' : 'time'} size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statutLabel}>{isValidated ? 'Validée' : 'En attente'}</Text>
            <Text style={styles.statutSubtext}>
              {isValidated ? 'Plongée validée par le moniteur' : 'En attente de validation par le moniteur'}
            </Text>
          </View>
        </View>
        <View style={styles.statutStats}>
          <View style={styles.statutStatItem}>
            <Text style={styles.statutStatValue}>{plongee.profondeur_max}m</Text>
            <Text style={styles.statutStatLabel}>Profondeur max</Text>
          </View>
          <View style={styles.statutDivider} />
          <View style={styles.statutStatItem}>
            <Text style={styles.statutStatValue}>{plongee.duree} min</Text>
            <Text style={styles.statutStatLabel}>Durée</Text>
          </View>
        </View>
      </LinearGradient>

      {sortie && (
        <View style={[styles.sortieBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="boat-outline" size={16} color={colors.primary} />
          <Text style={[styles.sortieText, { color: colors.textSecondary }]}>
            {sortie.lieu}
            {sortie.site ? ` — ${sortie.site}` : ''} · {formatDateTime(sortie.date_heure)}
          </Text>
        </View>
      )}

      {/* Informations plongée */}
      <SectionCard title="Informations plongée" icon="information-circle-outline">
        <InfoItem icon="water-outline" label="Profondeur max" value={`${plongee.profondeur_max} mètres`} highlight />
        <InfoItem icon="time-outline" label="Durée" value={`${plongee.duree} minutes`} />
        <InfoItem
          icon="thermometer-outline"
          label="Température de l'eau"
          value={plongee.temperature_eau != null ? `${plongee.temperature_eau}°C` : null}
        />
        <InfoItem icon="eye-outline" label="Visibilité" value={plongee.visibilite} />
        <InfoItem icon="pricetag-outline" label="Type de plongée" value={plongee.type_plongee} />
        {plongee.lien_photos && (
          <TouchableOpacity onPress={() => Linking.openURL(plongee.lien_photos)}>
            <InfoItem icon="image-outline" label="Photos" value="📸 Voir les photos" highlight />
          </TouchableOpacity>
        )}
      </SectionCard>

      {plongee.observations_faune && (
        <SectionCard title="Observations" icon="leaf-outline">
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {plongee.observations_faune}
          </Text>
        </SectionCard>
      )}

      {plongee.observations_moniteur && (
        <SectionCard title="Note du moniteur" icon="person-outline">
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {plongee.observations_moniteur}
          </Text>
        </SectionCard>
      )}

      {composers.length > 0 && (
        <SectionCard title="Palanquée" icon="people-outline">
          {composers.map((c) => (
            <View key={c.num_adherent} style={styles.palanqueeRow}>
              <Ionicons name="person-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.palanqueeText, { color: colors.text }]}>
                {c.adherent ? `${c.adherent.prenom} ${c.adherent.nom}` : `#${c.num_adherent}`}
              </Text>
            </View>
          ))}
        </SectionCard>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginHorizontal: 12,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
  },
  headerMeta: {
    fontSize: 12,
    marginTop: 3,
  },
  statutCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 18,
  },
  statutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statutIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statutSubtext: {
    fontSize: 13,
    marginTop: 2,
    color: 'rgba(255,255,255,0.85)',
  },
  statutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statutStatItem: {
    alignItems: 'center',
  },
  statutStatValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  statutStatLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  statutDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sortieBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sortieText: {
    fontSize: 13,
    flex: 1,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  palanqueeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  palanqueeText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default PlongeeDetailsScreen;
