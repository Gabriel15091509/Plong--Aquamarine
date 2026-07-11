// src/screens/Sorties/SortieDetailsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { sorties, inscriptions } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDateTime, formatCurrency, isPast } from '../../utils/helpers';

const SortieDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sortieId } = route.params;
  const { user } = useAuth();
  const { colors } = useTheme();

  const [sortie, setSortie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSortie = async () => {
    try {
      const response = await sorties.getDetails(sortieId);
      setSortie(response.data.data);

      // VÃ©rifier si l'utilisateur est dÃ©jÃ  inscrit
      if (user) {
        const inscResponse = await inscriptions.getMine();
        const existing = inscResponse.data.data?.find(
          (i) => i.id_sortie === sortieId
        );
        setInscriptionStatus(existing?.statut || null);
      }
    } catch (error) {
      console.error('Erreur chargement sortie:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSortie();
  }, [sortieId]);

  const handleInscription = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Veuillez vous connecter pour vous inscrire');
      return;
    }

    Alert.alert(
      'Confirmation',
      'Voulez-vous vous inscrire Ã  cette sortie ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'S\'inscrire',
          onPress: async () => {
            setSubmitting(true);
            try {
              await inscriptions.create({
                num_adherent: user.num_adherent,
                id_sortie: sortieId,
                statut: 'En attente',
              });
              setInscriptionStatus('En attente');
              Alert.alert('SuccÃ¨s', 'Inscription envoyÃ©e en attente de confirmation');
              loadSortie();
            } catch (error) {
              Alert.alert('Erreur', error.response?.data?.message || 'Erreur lors de l\'inscription');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleDesinscription = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous annuler votre inscription ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Annuler l\'inscription',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              // RÃ©cupÃ©rer l'ID de l'inscription
              const resp = await inscriptions.getMine();
              const insc = resp.data.data?.find(i => i.id_sortie === sortieId);
              if (insc) {
                await inscriptions.cancel(insc.id_inscription);
                setInscriptionStatus(null);
                Alert.alert('SuccÃ¨s', 'Inscription annulÃ©e');
                loadSortie();
              }
            } catch (error) {
              Alert.alert('Erreur', 'Erreur lors de l\'annulation');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!sortie) return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.errorText, { color: colors.error }]}>
        Sortie non trouvÃ©e
      </Text>
    </View>
  );

  const isFull = (sortie.nb_inscrits || 0) >= (sortie.nb_places || 0);
  const isPastSortie = isPast(sortie.date_heure);
  const canInscribe = !isPastSortie && !isFull && !inscriptionStatus;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {sortie.type || 'Sortie'}
        </Text>
      </View>

      <View style={[styles.content, { backgroundColor: colors.card }]}>
        <Text style={[styles.lieu, { color: colors.text }]}>{sortie.lieu}</Text>
        {sortie.site && (
          <Text style={[styles.site, { color: colors.textSecondary }]}>{sortie.site}</Text>
        )}

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {formatDateTime(sortie.date_heure)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {sortie.nb_inscrits || 0}/{sortie.nb_places || 0} inscrits
              {isFull && ' - Complet'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Niveau requis : {sortie.niveau_requis || 'â€”'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              Tarif : {formatCurrency(sortie.tarif)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <StatusBadge status={sortie.statut} />
          </View>
        </View>

        {sortie.description && (
          <View style={styles.descriptionSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {sortie.description}
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {isPastSortie && (
            <View style={[styles.pastBadge, { backgroundColor: colors.border }]}>
              <Text style={[styles.pastText, { color: colors.textSecondary }]}>
                Cette sortie est passÃ©e
              </Text>
            </View>
          )}

          {inscriptionStatus && (
            <View style={[styles.inscriptionStatus, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.inscriptionStatusText, { color: colors.primary }]}>
                Vous Ãªtes {inscriptionStatus.toLowerCase()}
              </Text>
              {!isPastSortie && (
                <TouchableOpacity onPress={handleDesinscription} disabled={submitting}>
                  <Text style={[styles.cancelLink, { color: colors.error }]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {canInscribe && (
            <TouchableOpacity
              style={[styles.inscrireButton, { backgroundColor: colors.primary }]}
              onPress={handleInscription}
              disabled={submitting}
            >
              <Text style={styles.inscrireButtonText}>
                {submitting ? 'Inscription...' : "S'inscrire"}
              </Text>
            </TouchableOpacity>
          )}

          {isFull && !inscriptionStatus && !isPastSortie && (
            <View style={[styles.fullBadge, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.fullText, { color: colors.error }]}>
                Complet - Plus de places disponibles
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lieu: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  site: {
    fontSize: 15,
    marginBottom: 16,
  },
  infoSection: {
    gap: 10,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
  },
  descriptionSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  inscrireButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  inscrireButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pastBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pastText: {
    fontSize: 14,
    fontWeight: '500',
  },
  fullBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  fullText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
  },
  inscriptionStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default SortieDetailsScreen;
