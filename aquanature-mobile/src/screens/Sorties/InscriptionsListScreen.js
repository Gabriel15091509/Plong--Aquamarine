// src/screens/Sorties/InscriptionsListScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { inscriptions } from '../../api/endpoints';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { useTheme } from '../../context/ThemeContext';
import { formatDate, formatDateTime } from '../../utils/helpers';

// Reprend la liste de InscriptionList.jsx cote web, filtree a "mes
// inscriptions" (le backend scope deja /inscriptions a l'adherent connecte
// pour un role non-staff, via InscriptionService.getAll).
const InscriptionsListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await inscriptions.getMine();
      setList(response.data.data || []);
    } catch (error) {
      console.log('Erreur chargement inscriptions:', error.response?.data || error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const sorted = [...list].sort(
    (a, b) => new Date(b.date_inscription) - new Date(a.date_inscription)
  );

  if (loading) return <LoadingSpinner />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes inscriptions</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id_inscription.toString()}
        renderItem={({ item }) => {
          const sortie = item.sortie;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() =>
                navigation.navigate('InscriptionDetails', { inscriptionId: item.id_inscription })
              }
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="boat" size={20} color={colors.primary} />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.sortieLabel, { color: colors.text }]} numberOfLines={1}>
                    {sortie ? `${sortie.type} - ${sortie.lieu}` : `Sortie N°${item.id_sortie}`}
                  </Text>
                  {sortie && (
                    <Text style={[styles.sortieDate, { color: colors.textSecondary }]}>
                      {formatDateTime(sortie.date_heure)}
                    </Text>
                  )}
                </View>
                <StatusBadge status={item.statut} />
              </View>

              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    Inscrit le {formatDate(item.date_inscription)}
                  </Text>
                </View>
                {item.statut === "Liste d'attente" && item.rang_liste_attente && (
                  <View style={styles.detailItem}>
                    <Ionicons name="list-outline" size={13} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      Rang N°{item.rang_liste_attente}
                    </Text>
                  </View>
                )}
                {item.presence_checked && (
                  <View style={styles.detailItem}>
                    <Ionicons
                      name={item.presence ? 'checkmark-circle' : 'close-circle'}
                      size={13}
                      color={item.presence ? colors.success : colors.error}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        { color: item.presence ? colors.success : colors.error },
                      ]}
                    >
                      {item.presence ? 'Présent' : 'Absent'}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="clipboard-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Vous n'avez pas encore d'inscription
            </Text>
            <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
              Inscrivez-vous à une sortie de plongée
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  sortieLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  sortieDate: {
    fontSize: 12,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubText: {
    fontSize: 14,
  },
});

export default InscriptionsListScreen;
